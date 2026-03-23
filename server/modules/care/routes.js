import express from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { randomId } from "../../lib/security.js";
import { nowIso } from "../../lib/time.js";
import { requireRole } from "../../middleware/require-auth.js";
import { listHouseholdMembers } from "../common/data.js";

function serializeMoodSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    user: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
    },
    moodKey: row.mood_key,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
    repliedAt: row.replied_at,
    replyStatus: row.reply_status,
    replyCount: Number(row.reply_count || 0),
    unreadReplyCount: Number(row.unread_reply_count || 0),
  };
}

function serializeReply(row) {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    author: {
      id: row.author_user_id,
      username: row.author_username,
    },
  };
}

export function createCareRouter({ database }) {
  const router = express.Router();
  router.use(requireRole("owner", "caregiver"));

  router.get(
    "/household",
    asyncHandler(async (req, res) => {
      res.json({
        household: req.context.household,
        membership: req.context.membership,
        capabilities: req.context.capabilities,
      });
    })
  );

  router.get(
    "/members",
    asyncHandler(async (req, res) => {
      res.json({
        members: await listHouseholdMembers(database, req.context.household.id),
      });
    })
  );

  router.get(
    "/moods",
    asyncHandler(async (req, res) => {
      const status = req.query.status === "ignored" ? "ignored" : req.query.status === "pending" ? "pending" : "all";
      const memberId = typeof req.query.memberId === "string" ? req.query.memberId : "";
      const requestedLimit = Number(req.query.limit || (status === "pending" ? 60 : 100));
      const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(200, requestedLimit)) : 60;
      const params = [req.context.household.id];
      const conditions = ["m.household_id = $1"];

      if (status !== "all") {
        params.push(status);
        conditions.push(`m.reply_status = $${params.length}`);
      }

      if (memberId) {
        params.push(memberId);
        conditions.push(`m.user_id = $${params.length}`);
      }

      params.push(limit);
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
            u.username,
            hm.display_name,
            COUNT(mr.id)::int AS reply_count,
            COALESCE(SUM(CASE WHEN mr.is_read = FALSE THEN 1 ELSE 0 END), 0)::int AS unread_reply_count
          FROM moods m
          JOIN users u ON u.id = m.user_id
          JOIN household_members hm ON hm.user_id = m.user_id
          LEFT JOIN mood_replies mr ON mr.mood_id = m.id
          WHERE ${conditions.join(" AND ")}
          GROUP BY
            m.id,
            m.user_id,
            m.mood_key,
            m.label,
            m.icon,
            m.created_at,
            m.replied_at,
            m.reply_status,
            u.username,
            hm.display_name
          ORDER BY m.created_at DESC
          LIMIT $${params.length}
        `,
        params
      );

      res.json({
        items: result.rows.map(serializeMoodSummary),
        limit,
      });
    })
  );

  router.get(
    "/moods/:id",
    asyncHandler(async (req, res) => {
      const moodResult = await database.query(
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
            u.username,
            hm.display_name,
            COUNT(mr.id)::int AS reply_count,
            COALESCE(SUM(CASE WHEN mr.is_read = FALSE THEN 1 ELSE 0 END), 0)::int AS unread_reply_count
          FROM moods m
          JOIN users u ON u.id = m.user_id
          JOIN household_members hm ON hm.user_id = m.user_id
          LEFT JOIN mood_replies mr ON mr.mood_id = m.id
          WHERE m.id = $1 AND m.household_id = $2
          GROUP BY
            m.id,
            m.user_id,
            m.mood_key,
            m.label,
            m.icon,
            m.created_at,
            m.replied_at,
            m.reply_status,
            u.username,
            hm.display_name
        `,
        [req.params.id, req.context.household.id]
      );

      const mood = moodResult.rows[0];
      if (!mood) {
        res.status(404).json({ error: "没有找到这条心情。" });
        return;
      }

      const repliesResult = await database.query(
        `
          SELECT
            mr.id,
            mr.author_user_id,
            mr.content,
            mr.created_at,
            mr.is_read,
            u.username AS author_username
          FROM mood_replies mr
          JOIN users u ON u.id = mr.author_user_id
          WHERE mr.mood_id = $1 AND mr.household_id = $2
          ORDER BY mr.created_at DESC
        `,
        [req.params.id, req.context.household.id]
      );

      res.json({
        mood: {
          ...serializeMoodSummary(mood),
          replies: repliesResult.rows.map(serializeReply),
        },
      });
    })
  );

  router.post(
    "/moods/:id/replies",
    asyncHandler(async (req, res) => {
      const content = String(req.body?.content || "").trim();
      if (!content) {
        res.status(400).json({ error: "请输入回复内容。" });
        return;
      }

      const moodResult = await database.query(
        `
          SELECT id, user_id
          FROM moods
          WHERE id = $1 AND household_id = $2
        `,
        [req.params.id, req.context.household.id]
      );
      const mood = moodResult.rows[0];
      if (!mood) {
        res.status(404).json({ error: "没有找到这条心情。" });
        return;
      }

      const createdAt = nowIso();
      await database.transaction(async (client) => {
        await client.query(
          `
            INSERT INTO mood_replies (
              id, household_id, mood_id, recipient_user_id, author_user_id, content, created_at, source, is_read
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', FALSE)
          `,
          [randomId(), req.context.household.id, mood.id, mood.user_id, req.context.user.id, content.slice(0, 240), createdAt]
        );

        await client.query(
          `
            UPDATE moods
            SET reply_status = 'replied', replied_at = $3
            WHERE id = $1 AND household_id = $2
          `,
          [mood.id, req.context.household.id, createdAt]
        );
      });

      res.status(201).json({ ok: true });
    })
  );

  router.post(
    "/moods/:id/status",
    asyncHandler(async (req, res) => {
      const replyStatus = String(req.body?.replyStatus || "").trim();
      if (!["pending", "ignored"].includes(replyStatus)) {
        res.status(400).json({ error: "无效的回复状态。" });
        return;
      }

      const updated = await database.query(
        `
          UPDATE moods
          SET reply_status = $3, replied_at = CASE WHEN $3 = 'pending' THEN NULL ELSE replied_at END
          WHERE id = $1 AND household_id = $2
          RETURNING id
        `,
        [req.params.id, req.context.household.id, replyStatus]
      );

      if (updated.rowCount === 0) {
        res.status(404).json({ error: "没有找到这条心情。" });
        return;
      }

      res.json({ ok: true });
    })
  );

  return router;
}
