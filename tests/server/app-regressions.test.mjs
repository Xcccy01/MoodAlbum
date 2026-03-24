import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createApp } from "../../server/app.js";

function createTestConfig() {
  return {
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
  };
}

test("健康检查数据库失败时返回 500 且不会让服务退出", async (t) => {
  let queryCount = 0;
  const database = {
    async query() {
      queryCount += 1;
      throw new Error("db down");
    },
  };
  const app = createApp({ config: createTestConfig(), database });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const healthPayload = await healthResponse.json();
  assert.equal(healthResponse.status, 500);
  assert.equal(healthPayload.error, "db down");
  assert.equal(queryCount, 1);

  const meResponse = await fetch(`${baseUrl}/api/me`);
  const mePayload = await meResponse.json();
  assert.equal(meResponse.status, 200);
  assert.equal(mePayload.authenticated, false);
});
