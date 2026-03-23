import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

export function createConfig({ preferMigrationUrl = false } = {}) {
  loadEnvFile(path.join(rootDir, ".env"));

  const nodeEnv = process.env.NODE_ENV || "development";
  const databaseUrl =
    (preferMigrationUrl ? process.env.DATABASE_MIGRATION_URL : "") ||
    process.env.DATABASE_URL ||
    "";
  const sessionSecret = process.env.SESSION_SECRET || "change-me";
  const config = {
    nodeEnv,
    isProduction: nodeEnv === "production",
    port: Number(process.env.PORT || 8787),
    databaseUrl,
    sessionSecret,
    secureCookies: resolveSecureCookiesMode(process.env.SECURE_COOKIES, nodeEnv),
    platformAdminSecret: process.env.PLATFORM_ADMIN_SECRET || "",
    runMigrationsOnBoot: process.env.RUN_MIGRATIONS !== "false",
  };

  validateConfig(config);
  return config;
}

function resolveSecureCookiesMode(rawValue, nodeEnv) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return nodeEnv === "production" ? "auto" : false;
}

export function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function validateConfig(config) {
  if (!config.isProduction) {
    return;
  }

  if (!config.databaseUrl) {
    throw new Error("生产环境必须设置 DATABASE_URL。");
  }

  if (!config.sessionSecret || config.sessionSecret === "change-me") {
    throw new Error("生产环境必须设置安全的 SESSION_SECRET。");
  }
}
