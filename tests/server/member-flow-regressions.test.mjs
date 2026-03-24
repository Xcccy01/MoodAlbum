import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createApp } from "../../server/app.js";
import { createDatabase } from "../../server/db/client.js";
import { runMigrations } from "../../server/db/migrate.js";
import { nowIso } from "../../server/lib/time.js";
import { randomId } from "../../server/lib/security.js";

async function startTestServer(configOverrides = {}) {
  const database = await createDatabase({ databaseUrl: "" });
  await runMigrations(database);

  const config = {
    nodeEnv: "test",
    isProduction: false,
    port: 0,
    databaseUrl: "",
    sessionSecret: "test-session-secret",
    trustProxy: false,
    secureCookies: false,
    platformAdminSecret: "",
    runMigrationsOnBoot: false,
    apiRateLimitWindowMs: 60_000,
    apiRateLimitMax: 1_200,
    anonymousApiRateLimitMax: 600,
    authRateLimitWindowMs: 60_000,
    loginRateLimitMax: 300,
    loginAccountRateLimitMax: 100,
    registerRateLimitMax: 200,
    ...configOverrides,
  };

  const app = createApp({ config, database });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    database,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await database.pool.end();
    },
  };
}

async function request(baseUrl, path, { method = "GET", body, cookie } = {}) {
  const headers = {};
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
    cookie: response.headers.get("set-cookie"),
  };
}

function extractCookie(setCookie) {
  return setCookie?.split(";")[0] || "";
}

async function register(baseUrl, username) {
  const result = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: { username, password: "secret123" },
  });

  assert.equal(result.response.status, 201);
  return {
    cookie: extractCookie(result.cookie),
    user: result.data.user,
  };
}

async function createHousehold(baseUrl, cookie, name) {
  const result = await request(baseUrl, "/api/households", {
    method: "POST",
    cookie,
    body: { name },
  });

  assert.equal(result.response.status, 201);
  return result.data;
}

async function createInvite(baseUrl, cookie, role) {
  const result = await request(baseUrl, "/api/care/invites", {
    method: "POST",
    cookie,
    body: { role },
  });

  assert.equal(result.response.status, 201);
  return result.data.invite.code;
}

async function joinHousehold(baseUrl, cookie, code) {
  return request(baseUrl, "/api/household-invites/join", {
    method: "POST",
    cookie,
    body: { code },
  });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

test("成员端能在默认内存库里看到回复并全部标记已读", async (t) => {
  const server = await startTestServer();
  t.after(async () => {
    await server.close();
  });

  const stamp = Date.now().toString(36);
  const owner = await register(server.baseUrl, `or_${stamp}`);
  await createHousehold(server.baseUrl, owner.cookie, `家庭_${stamp}`);
  const memberCode = await createInvite(server.baseUrl, owner.cookie, "member");
  const caregiverCode = await createInvite(server.baseUrl, owner.cookie, "caregiver");

  const member = await register(server.baseUrl, `mr_${stamp}`);
  await joinHousehold(server.baseUrl, member.cookie, memberCode);
  const moodCreated = await request(server.baseUrl, "/api/moods", {
    method: "POST",
    cookie: member.cookie,
    body: { moodKey: "bad" },
  });
  assert.equal(moodCreated.response.status, 201);

  const caregiver = await register(server.baseUrl, `cr_${stamp}`);
  await joinHousehold(server.baseUrl, caregiver.cookie, caregiverCode);
  const careMoods = await request(server.baseUrl, "/api/care/moods", {
    cookie: caregiver.cookie,
  });
  const moodId = careMoods.data.items[0].id;
  const replyCreated = await request(server.baseUrl, `/api/care/moods/${moodId}/replies`, {
    method: "POST",
    cookie: caregiver.cookie,
    body: { content: "先慢一点，已经看到啦。" },
  });
  assert.equal(replyCreated.response.status, 201);

  const beforeRead = await request(server.baseUrl, "/api/moods?limit=8", {
    cookie: member.cookie,
  });
  assert.equal(beforeRead.response.status, 200);
  assert.equal(beforeRead.data.unreadCount, 1);
  assert.equal(beforeRead.data.items[0].replies.length, 1);
  assert.equal(beforeRead.data.items[0].replies[0].content, "先慢一点，已经看到啦。");

  const readAll = await request(server.baseUrl, "/api/replies/read-all", {
    method: "POST",
    cookie: member.cookie,
  });
  assert.equal(readAll.response.status, 200);
  assert.equal(readAll.data.unreadCount, 0);

  const afterRead = await request(server.baseUrl, "/api/moods?limit=8", {
    cookie: member.cookie,
  });
  assert.equal(afterRead.data.unreadCount, 0);
  assert.equal(afterRead.data.items[0].replies.length, 1);
  assert.equal(afterRead.data.items[0].replies[0].isRead, true);
});

test("回复落在历史心情上时也能全部标记已读", async (t) => {
  const server = await startTestServer();
  t.after(async () => {
    await server.close();
  });

  const stamp = Date.now().toString(36);
  const owner = await register(server.baseUrl, `oh_${stamp}`);
  await createHousehold(server.baseUrl, owner.cookie, `家庭_${stamp}`);
  const memberCode = await createInvite(server.baseUrl, owner.cookie, "member");
  const caregiverCode = await createInvite(server.baseUrl, owner.cookie, "caregiver");

  const member = await register(server.baseUrl, `mh_${stamp}`);
  await joinHousehold(server.baseUrl, member.cookie, memberCode);
  for (let index = 0; index < 9; index += 1) {
    const moodCreated = await request(server.baseUrl, "/api/moods", {
      method: "POST",
      cookie: member.cookie,
      body: { moodKey: "bad" },
    });
    assert.equal(moodCreated.response.status, 201);
    await sleep(5);
  }

  const caregiver = await register(server.baseUrl, `ch_${stamp}`);
  await joinHousehold(server.baseUrl, caregiver.cookie, caregiverCode);
  const careMoods = await request(server.baseUrl, "/api/care/moods?limit=100", {
    cookie: caregiver.cookie,
  });
  const oldestMoodId = careMoods.data.items[careMoods.data.items.length - 1].id;
  const replyCreated = await request(server.baseUrl, `/api/care/moods/${oldestMoodId}/replies`, {
    method: "POST",
    cookie: caregiver.cookie,
    body: { content: "这条旧心情也有回复。" },
  });
  assert.equal(replyCreated.response.status, 201);

  const beforeRead = await request(server.baseUrl, "/api/moods?limit=8", {
    cookie: member.cookie,
  });
  assert.equal(beforeRead.data.unreadCount, 1);
  assert.equal(beforeRead.data.items.some((item) => item.id === beforeRead.data.latestReply.moodId), false);

  const readAll = await request(server.baseUrl, "/api/replies/read-all", {
    method: "POST",
    cookie: member.cookie,
  });
  assert.equal(readAll.response.status, 200);
  assert.equal(readAll.data.unreadCount, 0);
});

test("同一个邀请码并发加入时只能成功一次", async (t) => {
  const server = await startTestServer();
  t.after(async () => {
    await server.close();
  });

  const stamp = Date.now().toString(36);
  const owner = await register(server.baseUrl, `oi_${stamp}`);
  await createHousehold(server.baseUrl, owner.cookie, `家庭_${stamp}`);
  const memberCode = await createInvite(server.baseUrl, owner.cookie, "member");

  const memberA = await register(server.baseUrl, `ma_${stamp}`);
  const memberB = await register(server.baseUrl, `mb_${stamp}`);
  const [joinA, joinB] = await Promise.all([
    joinHousehold(server.baseUrl, memberA.cookie, memberCode),
    joinHousehold(server.baseUrl, memberB.cookie, memberCode),
  ]);
  const statuses = [joinA.response.status, joinB.response.status].sort((left, right) => left - right);
  assert.deepEqual(statuses, [201, 409]);

  const members = await request(server.baseUrl, "/api/care/members", {
    cookie: owner.cookie,
  });
  assert.equal(members.response.status, 200);
  assert.equal(members.data.members.length, 2);
});

test("账目会按中国时区月份分组", async (t) => {
  const server = await startTestServer();
  t.after(async () => {
    await server.close();
  });

  const stamp = Date.now().toString(36);
  const owner = await register(server.baseUrl, `oe_${stamp}`);
  const household = await createHousehold(server.baseUrl, owner.cookie, `家庭_${stamp}`);
  const spentAt = "2026-03-31T16:30:00.000Z";

  await server.database.query(
    `
      INSERT INTO expenses (
        id, household_id, user_id, amount_cents, category_id, category_label, category_icon, note, spent_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      randomId(),
      household.household.id,
      owner.user.id,
      3680,
      "groceries",
      "买菜",
      "🥬",
      "月末测试",
      spentAt,
      nowIso(),
    ]
  );

  const grouped = await request(server.baseUrl, "/api/expenses/grouped", {
    cookie: owner.cookie,
  });
  assert.equal(grouped.response.status, 200);
  assert.equal(grouped.data.months[0].month, "2026-04");
});
