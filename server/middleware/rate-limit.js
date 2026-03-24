import { USER_COOKIE } from "../config/constants.js";
import { parseCookies, readSessionValue } from "../lib/security.js";

const CLEANUP_INTERVAL_MS = 60_000;

export function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function getSessionUserId(req, sessionSecret = "") {
  if (req.context?.user?.id) {
    return req.context.user.id;
  }

  if (!sessionSecret) {
    return "";
  }

  const cookies = parseCookies(req.headers.cookie);
  return readSessionValue(cookies[USER_COOKIE], sessionSecret)?.userId || "";
}

function resolveLimit(limit, req) {
  if (typeof limit === "function") {
    return Number(limit(req));
  }
  return Number(limit);
}

function buildKey(req, { key, keyPrefix = "", sessionSecret = "" }) {
  const keyValue = key?.(req);
  if (keyValue) {
    return keyPrefix ? `${keyPrefix}:${keyValue}` : keyValue;
  }

  const userId = getSessionUserId(req, sessionSecret);
  const identity = userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
  return keyPrefix ? `${keyPrefix}:${identity}` : identity;
}

function createLimiter({
  windowMs = 60_000,
  max = 60,
  key,
  keyPrefix = "",
  sessionSecret = "",
  skip,
  message,
} = {}) {
  const buckets = new Map();
  let cleanupTimer = null;

  function startCleanup() {
    if (cleanupTimer) {
      return;
    }

    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(bucketKey);
        }
      }
    }, Math.min(CLEANUP_INTERVAL_MS, windowMs));

    if (cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  }

  startCleanup();

  return (req, res, next) => {
    if (req.method === "OPTIONS" || skip?.(req)) {
      next();
      return;
    }

    const limit = resolveLimit(max, req);
    if (!Number.isFinite(limit) || limit < 1) {
      next();
      return;
    }

    const bucketKey = buildKey(req, { key, keyPrefix, sessionSecret });
    const now = Date.now();
    let bucket = buckets.get(bucketKey);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, limit - bucket.count);
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: message || "请求过于频繁，请稍后再试。" });
      return;
    }

    next();
  };
}

export function rateLimit(options = {}) {
  return createLimiter({
    ...options,
    message: options.message || "请求过于频繁，请稍后再试。",
  });
}

export function authRateLimit(options = {}) {
  return createLimiter({
    ...options,
    message: options.message || "登录尝试过于频繁，请稍后再试。",
  });
}
