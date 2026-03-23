import crypto from "node:crypto";
import { USER_COOKIE, USER_SESSION_SECONDS } from "../config/constants.js";

export function randomId() {
  return crypto.randomUUID();
}

export function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, chunk) => {
    const [key, ...rest] = chunk.trim().split("=");
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, digest] = String(storedHash || "").split(":");
  if (!salt || !digest) {
    return false;
  }
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(digest, "hex"));
}

export function createSessionValue(userId, secret) {
  const expiresAt = Date.now() + USER_SESSION_SECONDS * 1000;
  const encoded = Buffer.from(
    JSON.stringify({
      kind: "user",
      userId,
      expiresAt,
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function readSessionValue(cookieValue, secret) {
  if (!cookieValue || !cookieValue.includes(".")) {
    return null;
  }

  const [encoded, signature] = cookieValue.split(".");
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  if (signature !== expected) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.kind !== "user" || !payload.userId || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildSetCookie(name, value, maxAgeSeconds, secure = false) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearCookie(name, secure = false) {
  return buildSetCookie(name, "", 0, secure);
}

export function applySessionCookie(res, sessionValue, secure) {
  res.append("Set-Cookie", buildSetCookie(USER_COOKIE, sessionValue, USER_SESSION_SECONDS, secure));
}

export function clearSessionCookie(res, secure) {
  res.append("Set-Cookie", buildClearCookie(USER_COOKIE, secure));
}
