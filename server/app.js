import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { asyncHandler } from "./lib/async-handler.js";
import { getSessionUserId, rateLimit } from "./middleware/rate-limit.js";
import { attachRequestContext } from "./middleware/request-context.js";
import { errorHandler, notFoundHandler } from "./middleware/require-auth.js";
import { createAppUpdatesRouter } from "./modules/app-updates/routes.js";
import { createAuthRouter } from "./modules/auth/routes.js";
import { createCareRouter } from "./modules/care/routes.js";
import { createCheckinsRouter } from "./modules/checkins/routes.js";
import { createExpensesRouter } from "./modules/expenses/routes.js";
import { createHouseholdsRouter } from "./modules/households/routes.js";
import { createMoodsRouter } from "./modules/moods/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

export function createApp({ config, database }) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(express.json({ limit: "1mb" }));

  app.get(
    "/api/health",
    asyncHandler(async (_req, res) => {
      await database.query("SELECT 1");
      res.json({ ok: true });
    })
  );

  app.use(
    "/api",
    rateLimit({
      windowMs: config.apiRateLimitWindowMs,
      sessionSecret: config.sessionSecret,
      max: (req) =>
        getSessionUserId(req, config.sessionSecret)
          ? config.apiRateLimitMax
          : config.anonymousApiRateLimitMax,
    })
  );
  app.use("/api", attachRequestContext({ config, database }));

  app.get("/api/me", (req, res) => {
    res.json({
      authenticated: Boolean(req.context?.user),
      user: req.context?.user || null,
      household: req.context?.household || null,
      membership: req.context?.membership || null,
      capabilities: req.context?.capabilities || {
        canAccessCare: false,
        canManageInvites: false,
      },
    });
  });

  app.use("/api/auth", createAuthRouter({ config, database }));
  app.use("/api", createHouseholdsRouter({ config, database }));
  app.use("/api", createMoodsRouter({ config, database }));
  app.use("/api", createCheckinsRouter({ config, database }));
  app.use("/api", createExpensesRouter({ config, database }));
  app.use("/api/care", createCareRouter({ config, database }));
  app.use("/api", createAppUpdatesRouter({ config, database }));

  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
