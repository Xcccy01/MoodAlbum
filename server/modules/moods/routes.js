import express from "express";
import { DEFAULT_MOODS } from "../../config/constants.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { randomId } from "../../lib/security.js";
import { nowIso } from "../../lib/time.js";
import { requireHousehold } from "../../middleware/require-auth.js";

function serializeReplies(rows) {
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    author: row.author_username
      ? {
          id: row.author_user_id,
          username: row.author_username,
        }
      : null,
  }));
}

function serializeMood(row, replies = []) {
  return {
    id: row.id,
    userId: row.user_id,
    moodKey: row.mood_key,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
    repliedAt: row.replied_at,
    replyStatus: row.reply_status,
    replyCount: Number(row.reply_count || replies.length),
    unreadReplyCount: Number(row.unread_reply_count || replies.filter((reply) => !reply.isRead).length),
    replies,
  };
}

function createPlaceholderList(values, startIndex = 1) {
  return values.map((_, index) => `$${startIndex + index}`).join(", ");
}

async function getCustomMoods(database, householdId, userId) {
  const result = await database.query(
    `
      SELECT id, label, icon, created_at
      FROM custom_moods
      WHERE household_id = $1 AND user_id = $2 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
    [householdId, userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
  }));
}

async function getLatestReply(database, householdId, userId) {
  const result = await database.query(
    `
      SELECT
        mr.id,
        mr.content,
        mr.created_at,
        mr.is_read,
        m.id AS mood_id,
        m.mood_key,
        m.label,
        m.icon
      FROM mood_replies mr
      JOIN moods m ON m.id = mr.mood_id
      WHERE mr.household_id = $1 AND mr.recipient_user_id = $2
      ORDER BY mr.created_at DESC
      LIMIT 1
    `,
    [householdId, userId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    moodId: row.mood_id,
    content: row.content,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    moodKey: row.mood_key,
    moodLabel: row.label,
    moodIcon: row.icon,
  };
}

async function getUnreadReplyCount(database, householdId, userId) {
  const result = await database.query(
    `
      SELECT COUNT(*)::int AS count
      FROM mood_replies
      WHERE household_id = $1 AND recipient_user_id = $2 AND is_read = FALSE
    `,
    [householdId, userId]
  );

  return Number(result.rows[0]?.count || 0);
}

export function createMoodsRouter({ database }) {
  const router = express.Router();

  router.get(
    "/custom-moods",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const items = await getCustomMoods(database, req.context.household.id, req.context.user.id);
      res.json({ items });
    })
  );

  router.post(
    "/custom-moods",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const label = String(req.body?.label || "").trim();
      const icon = String(req.body?.icon || "").trim();
      if (!label || label.length > 20 || !icon) {
        res.status(400).json({ error: "请输入有效的自定义心情。" });
        return;
      }

      const createdAt = nowIso();
      const id = randomId();
      await database.query(
        `
          INSERT INTO custom_moods (id, household_id, user_id, label, icon, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [id, req.context.household.id, req.context.user.id, label, icon, createdAt]
      );

      res.status(201).json({
        item: { id, label, icon, createdAt },
      });
    })
  );

  router.delete(
    "/custom-moods/:id",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const updated = await database.query(
        `
          UPDATE custom_moods
          SET deleted_at = $4
          WHERE id = $1 AND household_id = $2 AND user_id = $3 AND deleted_at IS NULL
          RETURNING id
        `,
        [req.params.id, req.context.household.id, req.context.user.id, nowIso()]
      );

      if (updated.rowCount === 0) {
        res.status(404).json({ error: "没有找到这个自定义心情。" });
        return;
      }

      res.json({ ok: true });
    })
  );

  router.post(
    "/moods",
    requireHousehold,
    asyncHandler(async (req, res) => {
      let mood = null;

      if (req.body?.moodKey) {
        mood = DEFAULT_MOODS[req.body.moodKey] || null;
      } else if (req.body?.customMoodId) {
        const result = await database.query(
          `
            SELECT id, label, icon
            FROM custom_moods
            WHERE id = $1 AND household_id = $2 AND user_id = $3 AND deleted_at IS NULL
          `,
          [req.body.customMoodId, req.context.household.id, req.context.user.id]
        );
        const row = result.rows[0];
        mood = row
          ? {
              key: row.id,
              label: row.label,
              icon: row.icon,
            }
          : null;
      }

      if (!mood) {
        res.status(400).json({ error: "请选择一个有效的心情。" });
        return;
      }

      const createdAt = nowIso();
      const id = randomId();
      await database.query(
        `
          INSERT INTO moods (
            id, household_id, user_id, mood_key, label, icon, created_at, reply_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        `,
        [
          id,
          req.context.household.id,
          req.context.user.id,
          mood.key,
          mood.label,
          mood.icon,
          createdAt,
        ]
      );

      res.status(201).json({
        mood: {
          id,
          moodKey: mood.key,
          label: mood.label,
          icon: mood.icon,
          createdAt,
          replyStatus: "pending",
        },
        latestReply: await getLatestReply(database, req.context.household.id, req.context.user.id),
        unreadCount: await getUnreadReplyCount(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.get(
    "/moods",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const requestedLimit = Number(req.query.limit || 8);
      const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, requestedLimit)) : 8;

      const result = await database.query(
        `
          SELECT
            m.id,
            m.user_id,
            m.mood_key,
            m.label,
            m.icon,
            m.created_at,
            m.replied_at,
            m.reply_status,
            COUNT(mr.id)::int AS reply_count,
            COALESCE(SUM(CASE WHEN mr.is_read = FALSE THEN 1 ELSE 0 END), 0)::int AS unread_reply_count
          FROM moods m
          LEFT JOIN mood_replies mr ON mr.mood_id = m.id
          WHERE m.household_id = $1 AND m.user_id = $2
          GROUP BY
            m.id,
            m.user_id,
            m.mood_key,
            m.label,
            m.icon,
            m.created_at,
            m.replied_at,
            m.reply_status
          ORDER BY m.created_at DESC
          LIMIT $3
        `,
        [req.context.household.id, req.context.user.id, limit]
      );

      const moodIds = result.rows.map((row) => row.id);
      const replies = moodIds.length
        ? await database.query(
            `
              SELECT
                mr.id,
                mr.mood_id,
                mr.author_user_id,
                mr.content,
                mr.created_at,
                mr.is_read,
                u.username AS author_username
              FROM mood_replies mr
              JOIN users u ON u.id = mr.author_user_id
              WHERE mr.mood_id IN (${createPlaceholderList(moodIds)})
              ORDER BY mr.created_at DESC
            `,
            moodIds
          )
        : { rows: [] };

      const repliesByMoodId = replies.rows.reduce((acc, row) => {
        if (!acc[row.mood_id]) {
          acc[row.mood_id] = [];
        }
        acc[row.mood_id].push(row);
        return acc;
      }, {});

      res.json({
        items: result.rows.map((row) => serializeMood(row, serializeReplies(repliesByMoodId[row.id] || []))),
        latestReply: await getLatestReply(database, req.context.household.id, req.context.user.id),
        unreadCount: await getUnreadReplyCount(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.get(
    "/replies/latest",
    requireHousehold,
    asyncHandler(async (req, res) => {
      res.json({
        latestReply: await getLatestReply(database, req.context.household.id, req.context.user.id),
        unreadCount: await getUnreadReplyCount(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.post(
    "/replies/read-all",
    requireHousehold,
    asyncHandler(async (req, res) => {
      await database.query(
        `
          UPDATE mood_replies
          SET is_read = TRUE, read_at = $3
          WHERE household_id = $1 AND recipient_user_id = $2 AND is_read = FALSE
        `,
        [req.context.household.id, req.context.user.id, nowIso()]
      );

      res.json({
        ok: true,
        latestReply: await getLatestReply(database, req.context.household.id, req.context.user.id),
        unreadCount: await getUnreadReplyCount(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  router.post(
    "/replies/read",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const replyIds = Array.isArray(req.body?.replyIds)
        ? req.body.replyIds.filter((item) => typeof item === "string" && item)
        : [];

      if (!replyIds.length) {
        res.status(400).json({ error: "请选择要标记的回复。" });
        return;
      }

      const placeholderList = createPlaceholderList(replyIds);
      const householdIndex = replyIds.length + 1;
      const recipientIndex = replyIds.length + 2;
      const readAtIndex = replyIds.length + 3;
      await database.query(
        `
          UPDATE mood_replies
          SET is_read = TRUE, read_at = $${readAtIndex}
          WHERE id IN (${placeholderList})
            AND household_id = $${householdIndex}
            AND recipient_user_id = $${recipientIndex}
        `,
        [...replyIds, req.context.household.id, req.context.user.id, nowIso()]
      );

      res.json({
        ok: true,
        latestReply: await getLatestReply(database, req.context.household.id, req.context.user.id),
        unreadCount: await getUnreadReplyCount(database, req.context.household.id, req.context.user.id),
      });
    })
  );

  return router;
}
