import express from "express";
import { DEFAULT_CATEGORIES } from "../../config/constants.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { randomId } from "../../lib/security.js";
import { getChinaMonthKey, nowIso } from "../../lib/time.js";
import { requireHousehold } from "../../middleware/require-auth.js";

function parseAmountToCents(rawAmount) {
  const normalized = String(rawAmount ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value * 100);
}

function formatMoneyFromCents(amountCents) {
  return Number((amountCents / 100).toFixed(2));
}

async function getAllCategories(database, householdId, userId) {
  const result = await database.query(
    `
      SELECT id, name, icon
      FROM custom_categories
      WHERE household_id = $1 AND user_id = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
    [householdId, userId]
  );

  const custom = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    isDefault: false,
  }));

  return [...DEFAULT_CATEGORIES, ...custom];
}

async function getGroupedExpenses(database, householdId, userId) {
  const result = await database.query(
    `
      SELECT
        id,
        amount_cents,
        category_id,
        category_label,
        category_icon,
        note,
        spent_at,
        created_at
      FROM expenses
      WHERE household_id = $1 AND user_id = $2
      ORDER BY spent_at DESC, created_at DESC
    `,
    [householdId, userId]
  );

  const monthsMap = new Map();
  for (const row of result.rows) {
    const monthKey = getChinaMonthKey(new Date(row.spent_at));
    const item = {
      id: row.id,
      amount: formatMoneyFromCents(row.amount_cents),
      amountCents: Number(row.amount_cents),
      categoryId: row.category_id,
      label: row.category_label,
      icon: row.category_icon,
      note: row.note || "",
      spentAt: row.spent_at,
      createdAt: row.created_at,
    };

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        month: monthKey,
        totalCents: 0,
        count: 0,
        categoriesMap: new Map(),
      });
    }

    const month = monthsMap.get(monthKey);
    month.totalCents += item.amountCents;
    month.count += 1;

    if (!month.categoriesMap.has(item.categoryId)) {
      month.categoriesMap.set(item.categoryId, {
        categoryId: item.categoryId,
        label: item.label,
        icon: item.icon,
        totalCents: 0,
        count: 0,
        items: [],
      });
    }

    const category = month.categoriesMap.get(item.categoryId);
    category.totalCents += item.amountCents;
    category.count += 1;
    category.items.push(item);
  }

  return Array.from(monthsMap.values()).map((month) => ({
    month: month.month,
    totalAmount: formatMoneyFromCents(month.totalCents),
    totalCents: month.totalCents,
    count: month.count,
    categories: Array.from(month.categoriesMap.values())
      .sort((left, right) => right.totalCents - left.totalCents)
      .map((category) => ({
        categoryId: category.categoryId,
        label: category.label,
        icon: category.icon,
        totalAmount: formatMoneyFromCents(category.totalCents),
        totalCents: category.totalCents,
        count: category.count,
        items: category.items,
      })),
  }));
}

export function createExpensesRouter({ database }) {
  const router = express.Router();

  router.get(
    "/categories",
    requireHousehold,
    asyncHandler(async (req, res) => {
      res.json({
        items: await getAllCategories(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.post(
    "/categories",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const name = String(req.body?.name || "").trim();
      const icon = String(req.body?.icon || "").trim();
      if (!name || name.length > 20 || !icon) {
        res.status(400).json({ error: "请输入有效的分类名称和图标。" });
        return;
      }

      const id = randomId();
      const createdAt = nowIso();
      await database.query(
        `
          INSERT INTO custom_categories (id, household_id, user_id, name, icon, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [id, req.context.household.id, req.context.user.id, name, icon, createdAt]
      );

      const category = {
        id,
        name,
        icon,
        isDefault: false,
      };
      res.status(201).json({
        item: category,
        category,
      });
    })
  );

  router.delete(
    "/categories/:id",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const result = await database.query(
        `
          UPDATE custom_categories
          SET deleted_at = $4
          WHERE id = $1 AND household_id = $2 AND user_id = $3 AND deleted_at IS NULL
          RETURNING id
        `,
        [req.params.id, req.context.household.id, req.context.user.id, nowIso()]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: "没有找到这个分类。" });
        return;
      }

      res.json({ ok: true });
    })
  );

  router.post(
    "/expenses",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const amountCents = parseAmountToCents(req.body?.amount);
      const categoryId = String(req.body?.categoryId || "").trim();
      const note = String(req.body?.note || "").trim();
      if (!amountCents) {
        res.status(400).json({ error: "请输入正确的金额。" });
        return;
      }

      const categories = await getAllCategories(database, req.context.household.id, req.context.user.id);
      const category = categories.find((item) => item.id === categoryId);
      if (!category) {
        res.status(400).json({ error: "请选择一个分类。" });
        return;
      }

      const spentAt = nowIso();
      await database.query(
        `
          INSERT INTO expenses (
            id, household_id, user_id, amount_cents, category_id, category_label, category_icon, note, spent_at, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        `,
        [
          randomId(),
          req.context.household.id,
          req.context.user.id,
          amountCents,
          category.id,
          category.name,
          category.icon,
          note.slice(0, 120),
          spentAt,
        ]
      );

      res.status(201).json({
        months: await getGroupedExpenses(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.delete(
    "/expenses/:id",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const deleted = await database.query(
        `
          DELETE FROM expenses
          WHERE id = $1 AND household_id = $2 AND user_id = $3
          RETURNING id
        `,
        [req.params.id, req.context.household.id, req.context.user.id]
      );

      if (deleted.rowCount === 0) {
        res.status(404).json({ error: "没有找到这笔支出。" });
        return;
      }

      res.json({
        ok: true,
        months: await getGroupedExpenses(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.get(
    "/expenses/grouped",
    requireHousehold,
    asyncHandler(async (req, res) => {
      res.json({
        months: await getGroupedExpenses(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  return router;
}
