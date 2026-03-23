import express from "express";
import { PLATFORM_UPDATE_PATH } from "../../config/constants.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { randomId } from "../../lib/security.js";
import { nowIso } from "../../lib/time.js";

const updateClients = new Set();

function serializeUpdate(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    version: row.version,
    title: row.title,
    message: row.message,
    apkUrl: row.apk_url,
    createdAt: row.created_at,
  };
}

function requirePlatformSecret(config) {
  return (req, res, next) => {
    const secret = req.headers["x-platform-secret"];
    if (!config.platformAdminSecret || secret !== config.platformAdminSecret) {
      res.status(401).json({ error: "平台密钥不正确。" });
      return;
    }
    next();
  };
}

export function createAppUpdatesRouter({ config, database }) {
  const router = express.Router();

  router.get(
    "/app-update",
    asyncHandler(async (_req, res) => {
      const result = await database.query(
        `
          SELECT id, version, title, message, apk_url, created_at
          FROM app_updates
          WHERE is_active = TRUE
          ORDER BY created_at DESC
          LIMIT 1
        `
      );

      res.json({ update: serializeUpdate(result.rows[0]) });
    })
  );

  router.get("/app/update/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    updateClients.add(res);
    res.write("event: ping\ndata: connected\n\n");

    req.on?.("close", () => {
      updateClients.delete(res);
    });
  });

  router.post(
    "/platform/app-update",
    requirePlatformSecret(config),
    asyncHandler(async (req, res) => {
      const version = String(req.body?.version || "").trim();
      const title = String(req.body?.title || "").trim() || "MoodAlbum has a new update";
      const message = String(req.body?.message || "").trim();
      const apkUrl = String(req.body?.apkUrl || "").trim() || PLATFORM_UPDATE_PATH;

      if (!version || version.length > 32) {
        res.status(400).json({ error: "请输入有效的版本号。" });
        return;
      }

      if (!message || message.length > 240) {
        res.status(400).json({ error: "更新说明需在 240 个字内。" });
        return;
      }

      const createdAt = nowIso();
      const id = randomId();
      await database.transaction(async (client) => {
        await client.query("UPDATE app_updates SET is_active = FALSE WHERE is_active = TRUE");
        await client.query(
          `
            INSERT INTO app_updates (id, version, title, message, apk_url, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, TRUE, $6)
          `,
          [id, version, title.slice(0, 80), message, apkUrl.slice(0, 240), createdAt]
        );
      });

      const update = {
        id,
        version,
        title: title.slice(0, 80),
        message,
        apkUrl: apkUrl.slice(0, 240),
        createdAt,
      };

      for (const client of updateClients) {
        client.write(`data: ${JSON.stringify(update)}\n\n`);
      }

      res.status(201).json({ update });
    })
  );

  return router;
}
