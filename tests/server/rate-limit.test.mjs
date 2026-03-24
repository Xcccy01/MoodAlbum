import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createApp } from "../../server/app.js";
import { USER_COOKIE } from "../../server/config/constants.js";
import { createDatabase } from "../../server/db/client.js";
import { runMigrations } from "../../server/db/migrate.js";
import { createSessionValue, hashPassword, randomId } from "../../server/lib/security.js";
import { nowIso } from "../../server/lib/time.js";

async function startTestServer(configOverrides = {}) {
  const database = await createDatabase({ databaseUrl: "" });
  await runMigrations(database);

  const config = {
    nodeEnv: "test",
    isProduction: false,
    port: 0,
    databaseUrl: "",
    sessionSecret: "test-session-secret",
    secureCookies: false,
    platformAdminSecret: "test-platform-secret",
    runMigrationsOnBoot: false,
    apiRateLimitWindowMs: 60_000,
    apiRateLimitMax: 1_200,
    anonymousApiRateLimitMax: 600,
    authRateLimitWindowMs: 60_000,
    loginRateLimitMax: 300,
    registerRateLimitMax: 200,
    ...configOverrides,
  };

  const app = createApp({ config, database });
  const server = createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    config,
    database,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await database.pool.end();
    },
  };
}

async function createUser(database, username, password = "secret123") {
  const user = {
    id: randomId(),
    username,
    password,
  };

  await database.query(
    `
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES ($1, $2, $3, $4)
    `,
    [user.id, user.username, hashPassword(user.password), nowIso()]
  );

  return user;
}

function buildSessionCookie(userId, secret) {
  return `${USER_COOKIE}=${encodeURIComponent(createSessionValue(userId, secret))}`;
}

async function request(baseUrl, path, { method = "GET", ip, cookie, body } = {}) {
  const headers = {};
  if (ip) {
    headers["x-forwarded-for"] = ip;
  }
  if (cookie) {
    headers.cookie = cookie;
  }
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  return {
    response,
    data: text ? JSON.parse(text) : {},
  };
}

test("同一 IP 下的不同登录用户不会共用 API 限流桶", async (t) => {
  const server = await startTestServer({
    apiRateLimitMax: 2,
    anonymousApiRateLimitMax: 1,
  });
  t.after(async () => {
    await server.close();
  });

  const firstUser = await createUser(server.database, "alpha_user");
  const secondUser = await createUser(server.database, "beta_user");
  const sharedIp = "198.51.100.42";

  const firstCookie = buildSessionCookie(firstUser.id, server.config.sessionSecret);
  const secondCookie = buildSessionCookie(secondUser.id, server.config.sessionSecret);

  const firstResponse = await request(server.baseUrl, "/api/me", {
    ip: sharedIp,
    cookie: firstCookie,
  });
  const secondResponse = await request(server.baseUrl, "/api/me", {
    ip: sharedIp,
    cookie: firstCookie,
  });
  const thirdResponse = await request(server.baseUrl, "/api/me", {
    ip: sharedIp,
    cookie: secondCookie,
  });

  assert.equal(firstResponse.response.status, 200);
  assert.equal(secondResponse.response.status, 200);
  assert.equal(thirdResponse.response.status, 200);
  assert.equal(thirdResponse.data.user.username, secondUser.username);
});

test("注册和登录使用独立的限流桶", async (t) => {
  const server = await startTestServer({
    loginRateLimitMax: 1,
    registerRateLimitMax: 1,
  });
  t.after(async () => {
    await server.close();
  });

  const ip = "203.0.113.15";
  const registerResponse = await request(server.baseUrl, "/api/auth/register", {
    method: "POST",
    ip,
    body: {
      username: "fresh_user",
      password: "secret123",
    },
  });

  const loginResponse = await request(server.baseUrl, "/api/auth/login", {
    method: "POST",
    ip,
    body: {
      username: "fresh_user",
      password: "secret123",
    },
  });

  const throttledLoginResponse = await request(server.baseUrl, "/api/auth/login", {
    method: "POST",
    ip,
    body: {
      username: "fresh_user",
      password: "secret123",
    },
  });

  assert.equal(registerResponse.response.status, 201);
  assert.equal(loginResponse.response.status, 200);
  assert.equal(throttledLoginResponse.response.status, 429);
  assert.equal(throttledLoginResponse.data.error, "登录尝试过于频繁，请稍后再试。");
});
