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
    trustProxy: resolveTrustProxy(process.env.TRUST_PROXY, nodeEnv),
    secureCookies: resolveSecureCookiesMode(process.env.SECURE_COOKIES, nodeEnv),
    platformAdminSecret: process.env.PLATFORM_ADMIN_SECRET || "",
    runMigrationsOnBoot: process.env.RUN_MIGRATIONS !== "false",
    apiRateLimitWindowMs: readPositiveInteger(process.env.API_RATE_LIMIT_WINDOW_MS, 60_000),
    apiRateLimitMax: readPositiveInteger(
      process.env.API_RATE_LIMIT_AUTH_MAX,
      nodeEnv === "production" ? 600 : 1_200
    ),
    anonymousApiRateLimitMax: readPositiveInteger(
      process.env.API_RATE_LIMIT_ANON_MAX,
      nodeEnv === "production" ? 240 : 600
    ),
    authRateLimitWindowMs: readPositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000),
    loginRateLimitMax: readPositiveInteger(
      process.env.LOGIN_RATE_LIMIT_MAX,
      nodeEnv === "production" ? 30 : 300
    ),
    loginAccountRateLimitMax: readPositiveInteger(
      process.env.LOGIN_ACCOUNT_RATE_LIMIT_MAX,
      nodeEnv === "production" ? 10 : 100
    ),
    registerRateLimitMax: readPositiveInteger(
      process.env.REGISTER_RATE_LIMIT_MAX,
      nodeEnv === "production" ? 20 : 200
    ),
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

function resolveTrustProxy(rawValue, nodeEnv) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  if (!normalized) {
    return nodeEnv === "production" ? 1 : false;
  }

  if (["false", "0", "off", "no"].includes(normalized)) {
    return false;
  }

  if (["true", "on", "yes"].includes(normalized)) {
    return 1;
  }

  const parsed = Number(normalized);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  return nodeEnv === "production" ? 1 : false;
}

function readPositiveInteger(rawValue, fallback) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
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
