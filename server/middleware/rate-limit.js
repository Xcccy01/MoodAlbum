const buckets = new Map();

const CLEANUP_INTERVAL_MS = 60_000;

let cleanupTimer = null;

function startCleanup(windowMs) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= cutoff) {
        buckets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

function getClientKey(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

export function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  startCleanup(windowMs);

  return (req, res, next) => {
    const key = getClientKey(req);
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - bucket.count));

    if (bucket.count > max) {
      res.status(429).json({ error: "请求过于频繁，请稍后再试。" });
      return;
    }

    next();
  };
}

export function authRateLimit({ windowMs = 60_000, max = 10 } = {}) {
  const authBuckets = new Map();

  return (req, res, next) => {
    const key = getClientKey(req);
    const now = Date.now();
    let bucket = authBuckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      authBuckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      res.status(429).json({ error: "登录尝试过于频繁，请稍后再试。" });
      return;
    }

    next();
  };
}
