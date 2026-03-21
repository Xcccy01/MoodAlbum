import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "family-care.db");
const envPath = path.join(rootDir, ".env");
const apkPath = path.join(rootDir, "MoodAlbum-debug.apk");

loadEnvFile(envPath);

const PORT = Number(process.env.PORT || 8787);
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "123456";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";
const ADMIN_COOKIE = "family_admin_session";
const USER_COOKIE = "family_user_session";
const CHINA_TIME_ZONE = "Asia/Shanghai";
const ADMIN_SESSION_SECONDS = 7 * 24 * 60 * 60;
const USER_SESSION_SECONDS = 15 * 24 * 60 * 60;
const DEFAULT_APK_DOWNLOAD_PATH = "/downloads/latest.apk";

const DEFAULT_MOODS = {
  bad: { key: "bad", label: "不太好", icon: "🌧️" },
  happy: { key: "happy", label: "开心", icon: "🌈" },
  tired: { key: "tired", label: "有点累", icon: "🛋️" },
  rest: { key: "rest", label: "想休息", icon: "🌙" },
  okay: { key: "okay", label: "一般", icon: "🫖" },
};

const DEFAULT_CATEGORIES = [
  { id: "groceries", name: "买菜", icon: "🥬", isDefault: true },
  { id: "fruit", name: "水果", icon: "🍎", isDefault: true },
  { id: "dining", name: "外出吃饭", icon: "🍜", isDefault: true },
  { id: "daily", name: "日用品", icon: "🧴", isDefault: true },
  { id: "medical", name: "医疗", icon: "💊", isDefault: true },
  { id: "transport", name: "交通", icon: "🚌", isDefault: true },
  { id: "other", name: "其他", icon: "📦", isDefault: true },
];

const PLANT_STAGES = [
  { threshold: 1, stage: "种子", emoji: "🌰" },
  { threshold: 3, stage: "发芽", emoji: "🌱" },
  { threshold: 7, stage: "长叶", emoji: "🌿" },
  { threshold: 14, stage: "含苞", emoji: "🌷" },
  { threshold: 30, stage: "开花", emoji: "🌸" },
  { threshold: 60, stage: "繁盛", emoji: "🌳" },
];

function loadEnvFile(filePath) {
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

fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS moods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    mood_key TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TEXT NOT NULL,
    replied_at TEXT,
    reply_status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS mood_replies (
    id TEXT PRIMARY KEY,
    mood_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default',
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    is_read INTEGER NOT NULL DEFAULT 0,
    read_at TEXT,
    FOREIGN KEY (mood_id) REFERENCES moods(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS custom_moods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    amount_cents INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    category_label TEXT NOT NULL,
    category_icon TEXT NOT NULL,
    note TEXT,
    spent_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    checkin_date TEXT NOT NULL,
    streak_count INTEGER NOT NULL,
    total_count INTEGER NOT NULL,
    plant_stage TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, checkin_date)
  );

  CREATE TABLE IF NOT EXISTS app_updates (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    apk_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`);

const app = express();
app.use(express.json({ limit: "1mb" }));
const updateClients = new Set();

function nowIso() {
  return new Date().toISOString();
}

function randomId() {
  return crypto.randomUUID();
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, segment) => {
    const [rawKey, ...rest] = segment.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function createSignedCookiePayload(payload, maxAgeSeconds) {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const encoded = Buffer.from(JSON.stringify({ ...payload, expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySignedCookiePayload(value) {
  if (!value || !value.includes(".")) {
    return null;
  }

  const [encoded, signature] = value.split(".");
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  if (signature !== expected) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCookie(res, name, value, maxAgeSeconds) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearCookie(res, name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function writeCookies(res, cookies) {
  res.setHeader("Set-Cookie", cookies);
}

function createUserSessionCookie(user) {
  return createSignedCookiePayload(
    {
      kind: "user",
      userId: user.id,
      username: user.username,
    },
    USER_SESSION_SECONDS
  );
}

function createAdminSessionCookie() {
  return createSignedCookiePayload({ kind: "admin" }, ADMIN_SESSION_SECONDS);
}

function readUserSessionPayload(req) {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifySignedCookiePayload(cookies[USER_COOKIE]);
  if (!payload || payload.kind !== "user" || !payload.userId) {
    return null;
  }
  return payload;
}

function readAdminSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifySignedCookiePayload(cookies[ADMIN_COOKIE]);
  return payload?.kind === "admin";
}

function requireUser(req, res, next) {
  const user = restoreUserSession(req, res);
  if (!user) {
    res.status(401).json({ error: "请先登录。" });
    return;
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!readAdminSession(req)) {
    res.status(401).json({ error: "需要先登录开发者后台。" });
    return;
  }
  next();
}

function normalizeUsername(rawValue) {
  return String(rawValue || "").trim();
}

function validateUsername(username) {
  return /^[\u4e00-\u9fa5A-Za-z0-9_-]{2,20}$/.test(username);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 64;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

function verifyPassword(password, storedHash) {
  const [salt, digest] = String(storedHash || "").split(":");
  if (!salt || !digest) {
    return false;
  }
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(digest, "hex"));
}

function getChinaDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const values = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }
  return `${values.year}-${values.month}-${values.day}`;
}

function toDayNumber(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

function getPlantStage(totalCount) {
  let current = PLANT_STAGES[0];
  for (const stage of PLANT_STAGES) {
    if (totalCount >= stage.threshold) {
      current = stage;
    }
  }
  return current;
}

function getNextPlantStage(totalCount) {
  return PLANT_STAGES.find((stage) => stage.threshold > totalCount) || null;
}

function parseAmountToCents(rawAmount) {
  const normalized = String(rawAmount ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value * 100);
}

function formatMoneyFromCents(amountCents) {
  return Number((amountCents / 100).toFixed(2));
}

function getUserByUsername(username) {
  return db
    .prepare(
      `
        SELECT id, username, password_hash, created_at
        FROM users
        WHERE username = ?
      `
      )
    .get(username);
}

function getUserById(userId) {
  return db
    .prepare(
      `
        SELECT id, username, password_hash, created_at
        FROM users
        WHERE id = ?
      `
    )
    .get(userId);
}

function restoreUserSession(req, res, { refresh = false } = {}) {
  const payload = readUserSessionPayload(req);
  if (!payload) {
    return null;
  }

  const user = getUserById(payload.userId);
  if (!user) {
    if (res) {
      writeCookies(res, [clearCookie(res, USER_COOKIE)]);
    }
    return null;
  }

  if (refresh && res) {
    writeCookies(res, [
      setCookie(
        res,
        USER_COOKIE,
        createUserSessionCookie({
          id: user.id,
          username: user.username,
        }),
        USER_SESSION_SECONDS
      ),
    ]);
  }

  return {
    id: user.id,
    username: user.username,
  };
}

function getCustomMoods(userId) {
  return db
    .prepare(
      `
        SELECT id, label, icon, created_at
        FROM custom_moods
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY datetime(created_at) DESC
      `
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      label: row.label,
      icon: row.icon,
      createdAt: row.created_at,
    }));
}

function getAllCategories(userId) {
  const custom = db
    .prepare(
      `
        SELECT id, name, icon
        FROM custom_categories
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY datetime(created_at) DESC
      `
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      isDefault: false,
    }));

  return [...DEFAULT_CATEGORIES, ...custom];
}

function getRepliesByMoodIds(moodIds) {
  if (!moodIds.length) {
    return {};
  }

  const placeholders = moodIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `
        SELECT id, mood_id, user_id, content, created_at, source, is_read
        FROM mood_replies
        WHERE mood_id IN (${placeholders})
        ORDER BY datetime(created_at) DESC
      `
    )
    .all(...moodIds);

  return rows.reduce((acc, row) => {
    if (!acc[row.mood_id]) {
      acc[row.mood_id] = [];
    }
    acc[row.mood_id].push({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      source: row.source,
      isRead: Boolean(row.is_read),
    });
    return acc;
  }, {});
}

function serializeMood(row, replies = []) {
  return {
    id: row.id,
    userId: row.user_id,
    user: row.username
      ? {
          id: row.user_id,
          username: row.username,
        }
      : undefined,
    moodKey: row.mood_key,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
    repliedAt: row.replied_at,
    replyStatus: row.reply_status,
    replyCount: row.reply_count ?? replies.length,
    unreadReplyCount: row.unread_reply_count ?? replies.filter((reply) => !reply.isRead).length,
    replies,
  };
}

function serializeMoodSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    user: row.username
      ? {
          id: row.user_id,
          username: row.username,
        }
      : undefined,
    moodKey: row.mood_key,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
    repliedAt: row.replied_at,
    replyStatus: row.reply_status,
    replyCount: row.reply_count ?? 0,
    unreadReplyCount: row.unread_reply_count ?? 0,
    replies: [],
  };
}

function getUnreadReplyCount(userId) {
  return db
    .prepare(`SELECT COUNT(*) AS count FROM mood_replies WHERE user_id = ? AND is_read = 0`)
    .get(userId).count;
}

function getLatestReply(userId) {
  const row = db
    .prepare(
      `
        SELECT mr.id, mr.mood_id, mr.user_id, mr.content, mr.created_at, mr.is_read, m.mood_key, m.label, m.icon
        FROM mood_replies mr
        JOIN moods m ON m.id = mr.mood_id
        WHERE mr.user_id = ?
        ORDER BY datetime(mr.created_at) DESC
        LIMIT 1
      `
    )
    .get(userId);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    moodId: row.mood_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    moodKey: row.mood_key,
    moodLabel: row.label,
    moodIcon: row.icon,
  };
}

function getCheckinProgress(userId) {
  const today = getChinaDateString();
  const latest = db
    .prepare(
      `
        SELECT checkin_date, streak_count, total_count, plant_stage
        FROM checkins
        WHERE user_id = ?
        ORDER BY checkin_date DESC
        LIMIT 1
      `
    )
    .get(userId);

  const recentDates = db
    .prepare(
      `
        SELECT checkin_date
        FROM checkins
        WHERE user_id = ?
        ORDER BY checkin_date DESC
        LIMIT 14
      `
    )
    .all(userId)
    .map((row) => row.checkin_date);

  const totalCount = latest?.total_count || 0;
  const nextStage = getNextPlantStage(totalCount);
  const plant = getPlantStage(Math.max(totalCount, 1));

  return {
    checkedInToday: latest?.checkin_date === today,
    streakCount: latest?.streak_count || 0,
    totalCount,
    plantStage: totalCount === 0 ? PLANT_STAGES[0].stage : plant.stage,
    plantEmoji: totalCount === 0 ? PLANT_STAGES[0].emoji : plant.emoji,
    nextStageAt: nextStage?.threshold || null,
    recentDates,
  };
}

function serializeAppUpdate(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    version: row.version,
    title: row.title,
    message: row.message,
    apkUrl: row.apk_url || DEFAULT_APK_DOWNLOAD_PATH,
    createdAt: row.created_at,
  };
}

function getLatestAppUpdate() {
  const row = db
    .prepare(
      `
        SELECT id, version, title, message, apk_url, created_at
        FROM app_updates
        WHERE is_active = 1
        ORDER BY datetime(created_at) DESC
        LIMIT 1
      `
    )
    .get();

  return serializeAppUpdate(row);
}

function sendSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastAppUpdate(update) {
  for (const client of updateClients) {
    sendSseEvent(client, "update", { update });
  }
}

function selectMoodOption({ moodKey, customMoodId, userId }) {
  if (customMoodId) {
    const custom = db
      .prepare(
        `
          SELECT id, label, icon
          FROM custom_moods
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `
      )
      .get(customMoodId, userId);

    if (!custom) {
      return null;
    }

    return {
      key: `custom:${custom.id}`,
      label: custom.label,
      icon: custom.icon,
    };
  }

  return DEFAULT_MOODS[moodKey] || null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: dbPath });
});

app.get("/downloads/latest.apk", (_req, res) => {
  if (!fs.existsSync(apkPath)) {
    res.status(404).json({ error: "APK file is not available yet." });
    return;
  }

  res.download(apkPath, "MoodAlbum-debug.apk");
});

app.get("/api/auth/session", (req, res) => {
  const user = restoreUserSession(req, res, { refresh: true });
  res.json({
    authenticated: Boolean(user),
    user: user ? { id: user.id, username: user.username } : null,
  });
});

app.post("/api/auth/register", (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");

  if (!validateUsername(username)) {
    res.status(400).json({ error: "用户名请使用 2 到 20 位中文、字母、数字、下划线或短横线。" });
    return;
  }

  if (!validatePassword(password)) {
    res.status(400).json({ error: "密码长度请控制在 6 到 64 位之间。" });
    return;
  }

  if (getUserByUsername(username)) {
    res.status(409).json({ error: "这个用户名已经被使用了。" });
    return;
  }

  const user = {
    id: randomId(),
    username,
    passwordHash: hashPassword(password),
    createdAt: nowIso(),
  };

  db.prepare(
    `
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run(user.id, user.username, user.passwordHash, user.createdAt);

  writeCookies(res, [setCookie(res, USER_COOKIE, createUserSessionCookie(user), USER_SESSION_SECONDS)]);
  res.status(201).json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

app.post("/api/auth/login", (req, res) => {
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");
  const user = getUserByUsername(username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: "用户名或密码不正确。" });
    return;
  }

  writeCookies(res, [setCookie(res, USER_COOKIE, createUserSessionCookie(user), USER_SESSION_SECONDS)]);
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

app.post("/api/auth/logout", (_req, res) => {
  writeCookies(res, [clearCookie(res, USER_COOKIE)]);
  res.json({ ok: true });
});

app.get("/api/custom-moods", requireUser, (req, res) => {
  res.json({ items: getCustomMoods(req.user.id) });
});

app.post("/api/custom-moods", requireUser, (req, res) => {
  const label = String(req.body?.label || "").trim();
  const icon = String(req.body?.icon || "").trim();

  if (!label || label.length > 12) {
    res.status(400).json({ error: "心情名称请控制在 1 到 12 个字符。" });
    return;
  }

  if (!icon || Array.from(icon).length > 4) {
    res.status(400).json({ error: "请选择一个简短表情。" });
    return;
  }

  const count = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM custom_moods
        WHERE user_id = ? AND deleted_at IS NULL
      `
    )
    .get(req.user.id).count;

  if (count >= 12) {
    res.status(400).json({ error: "自定义心情最多保留 12 个。" });
    return;
  }

  const item = {
    id: randomId(),
    userId: req.user.id,
    label,
    icon,
    createdAt: nowIso(),
  };

  db.prepare(
    `
      INSERT INTO custom_moods (id, user_id, label, icon, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(item.id, item.userId, item.label, item.icon, item.createdAt);

  res.status(201).json({
    item: {
      id: item.id,
      label: item.label,
      icon: item.icon,
      createdAt: item.createdAt,
    },
  });
});

app.delete("/api/custom-moods/:id", requireUser, (req, res) => {
  const target = db
    .prepare(
      `
        SELECT id
        FROM custom_moods
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `
    )
    .get(req.params.id, req.user.id);

  if (!target) {
    res.status(404).json({ error: "没有找到这个自定义心情。" });
    return;
  }

  db.prepare(
    `
      UPDATE custom_moods
      SET deleted_at = ?
      WHERE id = ? AND user_id = ?
    `
  ).run(nowIso(), req.params.id, req.user.id);

  res.json({ ok: true });
});

app.post("/api/moods", requireUser, (req, res) => {
  const option = selectMoodOption({
    moodKey: req.body?.moodKey,
    customMoodId: req.body?.customMoodId,
    userId: req.user.id,
  });

  if (!option) {
    res.status(400).json({ error: "请选择有效的心情。" });
    return;
  }

  const row = {
    id: randomId(),
    user_id: req.user.id,
    mood_key: option.key,
    label: option.label,
    icon: option.icon,
    created_at: nowIso(),
  };

  db.prepare(
    `
      INSERT INTO moods (id, user_id, mood_key, label, icon, created_at, reply_status)
      VALUES (@id, @user_id, @mood_key, @label, @icon, @created_at, 'pending')
    `
  ).run(row);

  res.status(201).json({
    mood: serializeMood(row, []),
    unreadReplyCount: getUnreadReplyCount(req.user.id),
  });
});

app.get("/api/moods", requireUser, (req, res) => {
  const requestedLimit = Number(req.query.limit || 8);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(20, requestedLimit)) : 8;
  const rows = db
    .prepare(
      `
        SELECT id, user_id, mood_key, label, icon, created_at, replied_at, reply_status
        FROM moods
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `
    )
    .all(req.user.id, limit);

  const repliesByMood = getRepliesByMoodIds(rows.map((row) => row.id));
  res.json({
    items: rows.map((row) => serializeMood(row, repliesByMood[row.id] || [])),
  });
});

app.get("/api/replies/latest", requireUser, (req, res) => {
  res.json({
    latestReply: getLatestReply(req.user.id),
    unreadCount: getUnreadReplyCount(req.user.id),
  });
});

app.get("/api/app/update", requireUser, (_req, res) => {
  res.json({ update: getLatestAppUpdate() });
});

app.get("/api/app/update/stream", requireUser, (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  updateClients.add(res);
  sendSseEvent(res, "ready", { ok: true });

  const currentUpdate = getLatestAppUpdate();
  if (currentUpdate) {
    sendSseEvent(res, "update", { update: currentUpdate });
  }

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 25000);

  res.on("close", () => {
    clearInterval(keepAlive);
    updateClients.delete(res);
  });
});

app.post("/api/replies/read", requireUser, (req, res) => {
  const replyIds = Array.isArray(req.body?.replyIds) ? req.body.replyIds.filter(Boolean) : [];
  if (!replyIds.length) {
    res.status(400).json({ error: "请提供要标记的回复。" });
    return;
  }

  const placeholders = replyIds.map(() => "?").join(", ");
  db.prepare(
    `
      UPDATE mood_replies
      SET is_read = 1, read_at = ?
      WHERE user_id = ? AND id IN (${placeholders})
    `
  ).run(nowIso(), req.user.id, ...replyIds);

  res.json({
    unreadCount: getUnreadReplyCount(req.user.id),
    latestReply: getLatestReply(req.user.id),
  });
});

app.get("/api/checkins/progress", requireUser, (req, res) => {
  res.json(getCheckinProgress(req.user.id));
});

app.post("/api/checkins", requireUser, (req, res) => {
  const today = getChinaDateString();
  const existing = db
    .prepare(
      `
        SELECT checkin_date, streak_count, total_count, plant_stage
        FROM checkins
        WHERE user_id = ? AND checkin_date = ?
      `
    )
    .get(req.user.id, today);

  if (existing) {
    const nextStage = getNextPlantStage(existing.total_count);
    res.json({
      checkedInToday: true,
      streakCount: existing.streak_count,
      totalCount: existing.total_count,
      plantStage: existing.plant_stage,
      nextStageAt: nextStage?.threshold || null,
    });
    return;
  }

  const previous = db
    .prepare(
      `
        SELECT checkin_date, streak_count, total_count
        FROM checkins
        WHERE user_id = ?
        ORDER BY checkin_date DESC
        LIMIT 1
      `
    )
    .get(req.user.id);

  const totalCount = (previous?.total_count || 0) + 1;
  const isContinuous =
    previous && toDayNumber(today) - toDayNumber(previous.checkin_date) === 1;
  const streakCount = isContinuous ? previous.streak_count + 1 : 1;
  const plant = getPlantStage(totalCount);

  db.prepare(
    `
      INSERT INTO checkins (id, user_id, checkin_date, streak_count, total_count, plant_stage, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  ).run(randomId(), req.user.id, today, streakCount, totalCount, plant.stage, nowIso());

  const nextStage = getNextPlantStage(totalCount);
  res.status(201).json({
    checkedInToday: true,
    streakCount,
    totalCount,
    plantStage: plant.stage,
    nextStageAt: nextStage?.threshold || null,
  });
});

app.get("/api/categories", requireUser, (req, res) => {
  res.json({ items: getAllCategories(req.user.id) });
});

app.post("/api/categories", requireUser, (req, res) => {
  const name = String(req.body?.name || "").trim();
  const icon = String(req.body?.icon || "").trim();

  if (!name || name.length > 12) {
    res.status(400).json({ error: "分类名称请控制在 1 到 12 个字符。" });
    return;
  }

  if (!icon) {
    res.status(400).json({ error: "请选择一个分类图标。" });
    return;
  }

  const row = {
    id: randomId(),
    userId: req.user.id,
    name,
    icon,
    createdAt: nowIso(),
  };

  db.prepare(
    `
      INSERT INTO custom_categories (id, user_id, name, icon, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(row.id, row.userId, row.name, row.icon, row.createdAt);

  res.status(201).json({
    category: {
      id: row.id,
      name: row.name,
      icon: row.icon,
      isDefault: false,
    },
  });
});

app.delete("/api/categories/:id", requireUser, (req, res) => {
  const target = db
    .prepare(
      `
        SELECT id
        FROM custom_categories
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `
    )
    .get(req.params.id, req.user.id);

  if (!target) {
    res.status(404).json({ error: "没有找到这个自定义分类。" });
    return;
  }

  db.prepare(
    `
      UPDATE custom_categories
      SET deleted_at = ?
      WHERE id = ? AND user_id = ?
    `
  ).run(nowIso(), req.params.id, req.user.id);

  res.json({ ok: true });
});

app.post("/api/expenses", requireUser, (req, res) => {
  const amountCents = parseAmountToCents(req.body?.amount);
  const categoryId = String(req.body?.categoryId || "").trim();
  const note = String(req.body?.note || "").trim().slice(0, 80);

  if (amountCents === null) {
    res.status(400).json({ error: "请输入正确的金额，最多保留两位小数。" });
    return;
  }

  const category = getAllCategories(req.user.id).find((item) => item.id === categoryId);
  if (!category) {
    res.status(400).json({ error: "请选择有效的分类。" });
    return;
  }

  const createdAt = nowIso();
  db.prepare(
    `
      INSERT INTO expenses (
        id, user_id, amount_cents, category_id, category_label, category_icon, note, spent_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    randomId(),
    req.user.id,
    amountCents,
    category.id,
    category.name,
    category.icon,
    note,
    createdAt,
    createdAt
  );

  res.status(201).json({ ok: true });
});

app.delete("/api/expenses/:id", requireUser, (req, res) => {
  const result = db
    .prepare(`DELETE FROM expenses WHERE user_id = ? AND id = ?`)
    .run(req.user.id, req.params.id);

  if (!result.changes) {
    res.status(404).json({ error: "这条账目不存在。" });
    return;
  }

  res.json({ ok: true });
});

app.get("/api/expenses/grouped", requireUser, (req, res) => {
  const rows = db
    .prepare(
      `
        SELECT id, amount_cents, category_id, category_label, category_icon, note, spent_at, created_at
        FROM expenses
        WHERE user_id = ?
        ORDER BY datetime(spent_at) DESC
      `
    )
    .all(req.user.id);

  const monthsMap = new Map();
  for (const row of rows) {
    const monthKey = row.spent_at.slice(0, 7);
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        month: monthKey,
        totalCents: 0,
        count: 0,
        categoriesMap: new Map(),
      });
    }

    const month = monthsMap.get(monthKey);
    month.totalCents += row.amount_cents;
    month.count += 1;

    if (!month.categoriesMap.has(row.category_id)) {
      month.categoriesMap.set(row.category_id, {
        categoryId: row.category_id,
        label: row.category_label,
        icon: row.category_icon,
        totalCents: 0,
        count: 0,
        items: [],
      });
    }

    const category = month.categoriesMap.get(row.category_id);
    category.totalCents += row.amount_cents;
    category.count += 1;
    category.items.push({
      id: row.id,
      amount: formatMoneyFromCents(row.amount_cents),
      amountCents: row.amount_cents,
      categoryId: row.category_id,
      categoryLabel: row.category_label,
      categoryIcon: row.category_icon,
      note: row.note || "",
      spentAt: row.spent_at,
      createdAt: row.created_at,
    });
  }

  const months = Array.from(monthsMap.values())
    .sort((left, right) => right.month.localeCompare(left.month))
    .map((month) => ({
      month: month.month,
      totalAmount: formatMoneyFromCents(month.totalCents),
      totalCents: month.totalCents,
      count: month.count,
      categories: Array.from(month.categoriesMap.values())
        .sort((left, right) => right.totalCents - left.totalCents)
        .map((category) => ({
          categoryId: category.categoryId,
          label: category.label,
          icon: category.icon,
          totalAmount: formatMoneyFromCents(category.totalCents),
          totalCents: category.totalCents,
          count: category.count,
          items: category.items,
        })),
    }));

  res.json({ months });
});

app.post("/api/admin/login", (req, res) => {
  const passcode = String(req.body?.passcode || "");
  if (!passcode || passcode !== ADMIN_PASSCODE) {
    res.status(401).json({ error: "口令不正确。" });
    return;
  }

  writeCookies(res, [setCookie(res, ADMIN_COOKIE, createAdminSessionCookie(), ADMIN_SESSION_SECONDS)]);
  res.json({ authenticated: true });
});

app.post("/api/admin/logout", (_req, res) => {
  writeCookies(res, [clearCookie(res, ADMIN_COOKIE)]);
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: readAdminSession(req) });
});

app.get("/api/admin/app-update", requireAdmin, (_req, res) => {
  res.json({ update: getLatestAppUpdate() });
});

app.post("/api/admin/app-update", requireAdmin, (req, res) => {
  const version = String(req.body?.version || "").trim();
  const title = String(req.body?.title || "").trim() || "MoodAlbum has a new update";
  const message = String(req.body?.message || "").trim();
  const apkUrl = String(req.body?.apkUrl || "").trim() || DEFAULT_APK_DOWNLOAD_PATH;

  if (!version || version.length > 32) {
    res.status(400).json({ error: "Please enter a valid version number." });
    return;
  }

  if (!message || message.length > 240) {
    res.status(400).json({ error: "Please enter an update note within 240 characters." });
    return;
  }

  db.prepare(`UPDATE app_updates SET is_active = 0 WHERE is_active = 1`).run();

  const row = {
    id: randomId(),
    version,
    title: title.slice(0, 80),
    message,
    apkUrl: apkUrl.slice(0, 240),
    createdAt: nowIso(),
  };

  db.prepare(
    `
      INSERT INTO app_updates (id, version, title, message, apk_url, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `
  ).run(row.id, row.version, row.title, row.message, row.apkUrl, row.createdAt);

  const update = serializeAppUpdate({
    id: row.id,
    version: row.version,
    title: row.title,
    message: row.message,
    apk_url: row.apkUrl,
    created_at: row.createdAt,
  });

  broadcastAppUpdate(update);
  res.status(201).json({ update });
});

app.get("/api/admin/moods", requireAdmin, (req, res) => {
  const status = req.query.status === "ignored" ? "ignored" : req.query.status === "pending" ? "pending" : "all";
  const requestedLimit = Number(req.query.limit || (status === "pending" ? 60 : 100));
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(200, requestedLimit)) : 60;
  const whereClause =
    status === "pending"
      ? "WHERE m.reply_status = 'pending'"
      : status === "ignored"
        ? "WHERE m.reply_status = 'ignored'"
        : "";
  const rows = db
    .prepare(
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
          COUNT(mr.id) AS reply_count,
          COALESCE(SUM(CASE WHEN mr.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread_reply_count
        FROM moods m
        LEFT JOIN users u ON u.id = m.user_id
        LEFT JOIN mood_replies mr ON mr.mood_id = m.id
        ${whereClause}
        GROUP BY m.id, m.user_id, m.mood_key, m.label, m.icon, m.created_at, m.replied_at, m.reply_status, u.username
        ORDER BY datetime(m.created_at) DESC
        LIMIT ?
      `
      )
      .all(limit);

    res.json({
      items: rows.map((row) => serializeMoodSummary(row)),
      limit,
    });
  });

app.get("/api/admin/moods/:id", requireAdmin, (req, res) => {
  const row = db
    .prepare(
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
          COUNT(mr.id) AS reply_count,
          COALESCE(SUM(CASE WHEN mr.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread_reply_count
        FROM moods m
        LEFT JOIN users u ON u.id = m.user_id
        LEFT JOIN mood_replies mr ON mr.mood_id = m.id
        WHERE m.id = ?
        GROUP BY m.id, m.user_id, m.mood_key, m.label, m.icon, m.created_at, m.replied_at, m.reply_status, u.username
      `
    )
    .get(req.params.id);

  if (!row) {
    res.status(404).json({ error: "没有找到这条心情记录。" });
    return;
  }

  const repliesByMood = getRepliesByMoodIds([row.id]);
  res.json({
    mood: serializeMood(row, repliesByMood[row.id] || []),
  });
});

app.post("/api/admin/moods/:id/replies", requireAdmin, (req, res) => {
  const content = String(req.body?.content || "").trim();
  if (!content) {
    res.status(400).json({ error: "请输入回复内容。" });
    return;
  }

  const mood = db
    .prepare(
      `
        SELECT id, user_id
        FROM moods
        WHERE id = ?
      `
    )
    .get(req.params.id);

  if (!mood) {
    res.status(404).json({ error: "没有找到这条心情记录。" });
    return;
  }

  const createdAt = nowIso();
  db.prepare(
    `
      INSERT INTO mood_replies (id, mood_id, user_id, content, created_at, source, is_read)
      VALUES (?, ?, ?, ?, ?, 'manual', 0)
    `
  ).run(randomId(), mood.id, mood.user_id, content.slice(0, 240), createdAt);

  db.prepare(
    `
      UPDATE moods
      SET reply_status = 'replied', replied_at = ?
      WHERE id = ?
    `
  ).run(createdAt, mood.id);

    const updated = db
      .prepare(
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
            COUNT(mr.id) AS reply_count,
            COALESCE(SUM(CASE WHEN mr.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread_reply_count
          FROM moods m
          LEFT JOIN users u ON u.id = m.user_id
          LEFT JOIN mood_replies mr ON mr.mood_id = m.id
          WHERE m.id = ?
          GROUP BY m.id, m.user_id, m.mood_key, m.label, m.icon, m.created_at, m.replied_at, m.reply_status, u.username
        `
      )
      .get(mood.id);

  const repliesByMood = getRepliesByMoodIds([mood.id]);
  res.status(201).json({
    mood: serializeMood(updated, repliesByMood[mood.id] || []),
  });
});

app.post("/api/admin/moods/:id/status", requireAdmin, (req, res) => {
  const replyStatus = String(req.body?.replyStatus || "").trim();
  if (!["pending", "ignored"].includes(replyStatus)) {
    res.status(400).json({ error: "Invalid reply status." });
    return;
  }

  const mood = db
    .prepare(
      `
        SELECT id
        FROM moods
        WHERE id = ?
      `
    )
    .get(req.params.id);

  if (!mood) {
    res.status(404).json({ error: "Mood record not found." });
    return;
  }

  db.prepare(
    `
      UPDATE moods
      SET reply_status = ?, replied_at = CASE WHEN ? = 'pending' THEN NULL ELSE replied_at END
      WHERE id = ?
    `
  ).run(replyStatus, replyStatus, req.params.id);

  const updated = db
    .prepare(
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
          COUNT(mr.id) AS reply_count,
          COALESCE(SUM(CASE WHEN mr.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread_reply_count
        FROM moods m
        LEFT JOIN users u ON u.id = m.user_id
        LEFT JOIN mood_replies mr ON mr.mood_id = m.id
        WHERE m.id = ?
        GROUP BY m.id, m.user_id, m.mood_key, m.label, m.icon, m.created_at, m.replied_at, m.reply_status, u.username
      `
    )
    .get(req.params.id);

  const repliesByMood = getRepliesByMoodIds([req.params.id]);
  res.json({
    mood: serializeMood(updated, repliesByMood[req.params.id] || []),
  });
});

app.delete("/api/admin/moods/history", requireAdmin, (_req, res) => {
  db.prepare(`DELETE FROM mood_replies`).run();
  db.prepare(`DELETE FROM moods`).run();
  res.json({ ok: true });
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Family care API running on http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSCODE || !process.env.SESSION_SECRET) {
    console.log("Using fallback ADMIN_PASSCODE / SESSION_SECRET for local development.");
  }
});
