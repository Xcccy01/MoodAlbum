import crypto from "node:crypto";
import express from "express";
import { INVITE_EXPIRY_DAYS, INVITE_ROLES } from "../../config/constants.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { randomId } from "../../lib/security.js";
import { nowIso } from "../../lib/time.js";
import { requireAuth, requireRole } from "../../middleware/require-auth.js";

function makeInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isMembershipConflict(error) {
  const code = String(error?.code || "");
  const constraint = String(error?.constraint || "");
  const message = String(error?.message || "");
  const detail = String(error?.detail || error?.data?.details || "");

  if (code !== "23505") {
    return false;
  }

  return (
    constraint === "household_members_user_id_key" ||
    constraint === "household_members_pkey" ||
    message.includes("household_members") ||
    detail.includes("(user_id)=")
  );
}

export function createHouseholdsRouter({ database }) {
  const router = express.Router();

  router.post(
    "/households",
    requireAuth,
    asyncHandler(async (req, res) => {
      if (req.context.household) {
        res.status(409).json({ error: "当前账号已经加入家庭了。" });
        return;
      }

      const name = String(req.body?.name || "").trim();
      if (name.length < 2 || name.length > 40) {
        res.status(400).json({ error: "家庭名称需在 2 到 40 个字之间。" });
        return;
      }

      const householdId = randomId();
      const createdAt = nowIso();

      try {
        await database.transaction(async (client) => {
          await client.query(
            `
              INSERT INTO households (id, name, owner_user_id, created_at)
              VALUES ($1, $2, $3, $4)
            `,
            [householdId, name, req.context.user.id, createdAt]
          );

          await client.query(
            `
              INSERT INTO household_members (
                id, household_id, user_id, role, display_name, status, created_at, joined_at
              )
              VALUES ($1, $2, $3, 'owner', $4, 'active', $5, $5)
            `,
            [randomId(), householdId, req.context.user.id, req.context.user.username, createdAt]
          );
        });
      } catch (error) {
        if (isMembershipConflict(error)) {
          res.status(409).json({ error: "当前账号已经加入家庭了。" });
          return;
        }
        throw error;
      }

      res.status(201).json({
        household: { id: householdId, name },
        membership: {
          householdId,
          role: "owner",
          displayName: req.context.user.username,
        },
      });
    })
  );

  router.post(
    "/household-invites/join",
    requireAuth,
    asyncHandler(async (req, res) => {
      if (req.context.household) {
        res.status(409).json({ error: "当前账号已经加入家庭了。" });
        return;
      }

      const code = String(req.body?.code || "").trim().toUpperCase();
      if (!code) {
        res.status(400).json({ error: "请输入邀请码。" });
        return;
      }

      const joinedAt = nowIso();
      let invite;
      await database.transaction(async (client) => {
        const inviteResult = await client.query(
          `
            SELECT hi.*, h.name AS household_name
            FROM household_invites hi
            JOIN households h ON h.id = hi.household_id
            WHERE hi.code = $1
          `,
          [code]
        );

        invite = inviteResult.rows[0];
        if (!invite) {
          throw createHttpError(404, "邀请码不存在。");
        }

        if (invite.status === "revoked" || invite.revoked_at) {
          throw createHttpError(409, "这个邀请码已经失效了。");
        }

        if (invite.status === "used" || invite.used_at) {
          throw createHttpError(409, "这个邀请码已经被使用了。");
        }

        if (new Date(invite.expires_at).getTime() < Date.now()) {
          await client.query(
            "UPDATE household_invites SET status = 'expired' WHERE id = $1",
            [invite.id]
          );
          throw createHttpError(409, "这个邀请码已经过期了。");
        }

        const claimedInvite = await client.query(
          `
            UPDATE household_invites
            SET status = 'used', used_by_user_id = $2, used_at = $3
            WHERE id = $1
              AND status = 'active'
              AND revoked_at IS NULL
              AND used_at IS NULL
              AND expires_at >= $4
            RETURNING id
          `,
          [invite.id, req.context.user.id, joinedAt, joinedAt]
        );

        if (claimedInvite.rowCount === 0) {
          const currentInviteResult = await client.query(
            `
              SELECT status, used_at, revoked_at, expires_at
              FROM household_invites
              WHERE id = $1
            `,
            [invite.id]
          );
          const currentInvite = currentInviteResult.rows[0];

          if (!currentInvite) {
            throw createHttpError(404, "邀请码不存在。");
          }
          if (currentInvite.status === "revoked" || currentInvite.revoked_at) {
            throw createHttpError(409, "这个邀请码已经失效了。");
          }
          if (currentInvite.status === "used" || currentInvite.used_at) {
            throw createHttpError(409, "这个邀请码已经被使用了。");
          }
          if (new Date(currentInvite.expires_at).getTime() < Date.now()) {
            throw createHttpError(409, "这个邀请码已经过期了。");
          }

          throw createHttpError(409, "这个邀请码当前不可用。");
        }

        await client.query(
          `
            INSERT INTO household_members (
              id, household_id, user_id, role, display_name, status, created_at, joined_at
            )
            VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)
          `,
          [randomId(), invite.household_id, req.context.user.id, invite.role, req.context.user.username, joinedAt]
        );

      });

      res.status(201).json({
        household: {
          id: invite.household_id,
          name: invite.household_name,
        },
        membership: {
          householdId: invite.household_id,
          role: invite.role,
          displayName: req.context.user.username,
        },
      });
    })
  );

  router.get(
    "/care/invites",
    requireRole("owner"),
    asyncHandler(async (req, res) => {
      const result = await database.query(
        `
          SELECT id, code, role, status, expires_at, created_at, used_at, revoked_at
          FROM household_invites
          WHERE household_id = $1
          ORDER BY created_at DESC
        `,
        [req.context.household.id]
      );

      res.json({
        invites: result.rows.map((row) => ({
          id: row.id,
          code: row.code,
          role: row.role,
          status: row.status,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          usedAt: row.used_at,
          revokedAt: row.revoked_at,
        })),
      });
    })
  );

  router.post(
    "/care/invites",
    requireRole("owner"),
    asyncHandler(async (req, res) => {
      const role = String(req.body?.role || "").trim();
      if (!INVITE_ROLES.includes(role)) {
        res.status(400).json({ error: "邀请角色不正确。" });
        return;
      }

      const createdAt = nowIso();
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const invite = {
        id: randomId(),
        code: makeInviteCode(),
        householdId: req.context.household.id,
        role,
        createdByUserId: req.context.user.id,
        createdAt,
        expiresAt,
      };

      await database.query(
        `
          INSERT INTO household_invites (
            id, household_id, code, role, created_by_user_id, expires_at, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
        `,
        [
          invite.id,
          invite.householdId,
          invite.code,
          invite.role,
          invite.createdByUserId,
          invite.expiresAt,
          invite.createdAt,
        ]
      );

      res.status(201).json({
        invite: {
          id: invite.id,
          code: invite.code,
          role: invite.role,
          status: "active",
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        },
      });
    })
  );

  router.post(
    "/care/invites/:id/revoke",
    requireRole("owner"),
    asyncHandler(async (req, res) => {
      const updated = await database.query(
        `
          UPDATE household_invites
          SET status = 'revoked', revoked_at = $3
          WHERE id = $1 AND household_id = $2 AND status = 'active'
          RETURNING id
        `,
        [req.params.id, req.context.household.id, nowIso()]
      );

      if (updated.rowCount === 0) {
        res.status(404).json({ error: "没有找到可撤销的邀请码。" });
        return;
      }

      res.json({ ok: true });
    })
  );

  return router;
}
