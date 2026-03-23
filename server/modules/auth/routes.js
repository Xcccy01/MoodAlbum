import express from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { applySessionCookie, clearSessionCookie, createSessionValue, hashPassword, randomId, verifyPassword } from "../../lib/security.js";
import { nowIso } from "../../lib/time.js";

function normalizeUsername(rawValue) {
  return String(rawValue || "").trim();
}

function validateUsername(username) {
  return /^[\u4e00-\u9fa5A-Za-z0-9_-]{2,20}$/.test(username);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 64;
}

function buildAuthPayload(context) {
  return {
    authenticated: Boolean(context?.user),
    user: context?.user || null,
    household: context?.household || null,
    membership: context?.membership || null,
    capabilities: context?.capabilities || {
      canAccessCare: false,
      canManageInvites: false,
    },
  };
}

export function createAuthRouter({ config, database }) {
  const router = express.Router();

  router.get(
    "/session",
    asyncHandler(async (req, res) => {
      res.json(buildAuthPayload(req.context));
    })
  );

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      res.json(buildAuthPayload(req.context));
    })
  );

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const username = normalizeUsername(req.body?.username);
      const password = String(req.body?.password || "");

      if (!validateUsername(username)) {
        res.status(400).json({ error: "用户名需为 2 到 20 位中文、字母、数字、下划线或短横线。" });
        return;
      }

      if (!validatePassword(password)) {
        res.status(400).json({ error: "密码长度需在 6 到 64 位之间。" });
        return;
      }

      const existing = await database.query("SELECT id FROM users WHERE username = $1", [username]);
      if (existing.rowCount > 0) {
        res.status(409).json({ error: "这个用户名已经被使用了。" });
        return;
      }

      const userId = randomId();
      await database.query(
        `
          INSERT INTO users (id, username, password_hash, created_at)
          VALUES ($1, $2, $3, $4)
        `,
        [userId, username, hashPassword(password), nowIso()]
      );

      applySessionCookie(res, createSessionValue(userId, config.sessionSecret), config.secureCookies);
      res.status(201).json({
        authenticated: true,
        user: { id: userId, username },
        household: null,
        membership: null,
        capabilities: {
          canAccessCare: false,
          canManageInvites: false,
        },
      });
    })
  );

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const username = normalizeUsername(req.body?.username);
      const password = String(req.body?.password || "");
      const result = await database.query(
        `
          SELECT id, username, password_hash
          FROM users
          WHERE username = $1
        `,
        [username]
      );

      const user = result.rows[0];
      if (!user || !verifyPassword(password, user.password_hash)) {
        res.status(401).json({ error: "用户名或密码不正确。" });
        return;
      }

      applySessionCookie(res, createSessionValue(user.id, config.sessionSecret), config.secureCookies);
      res.json({
        authenticated: true,
        user: { id: user.id, username: user.username },
      });
    })
  );

  router.post("/logout", (_req, res) => {
    clearSessionCookie(res, config.secureCookies);
    res.json({ ok: true });
  });

  return router;
}
