import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import autocannon from "autocannon";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8790";
const outputDir = path.resolve("test-artifacts");

fs.mkdirSync(outputDir, { recursive: true });

const username = `load_${Date.now().toString(36)}`;
const password = "loadtest123";

async function request(url, options = {}) {
  const target = new URL(url);
  const transport = target.protocol === "https:" ? https : http;
  const body = options.body || "";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (body) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return await new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: options.method || "GET",
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const data = text ? JSON.parse(text) : {};
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(data.error || `${res.statusCode} ${res.statusMessage}`));
            return;
          }
          resolve({
            response: {
              status: res.statusCode,
              headers: res.headers,
            },
            data,
          });
        });
      }
    );

    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function getSessionCookie() {
  const register = await request(`${baseUrl}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const setCookieHeader = register.response.headers["set-cookie"];
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const setCookie = cookies.find((item) => item?.startsWith("family_user_session="));
  if (!setCookie) {
    throw new Error("注册后没有收到会话 Cookie。");
  }

  return setCookie.split(";")[0];
}

function runScenario(title, options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        title,
        requestsAverage: Number(result.requests.average.toFixed(2)),
        latencyAverage: Number(result.latency.average.toFixed(2)),
        latencyP99: Number(result.latency.p99.toFixed(2)),
        throughputAverage: Number(result.throughput.average.toFixed(2)),
        errors: result.errors,
        timeouts: result.timeouts,
        non2xx: result.non2xx,
      });
    });
  });
}

const cookie = await getSessionCookie();

await request(`${baseUrl}/api/moods`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({ moodKey: "happy" }),
});

await request(`${baseUrl}/api/expenses`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({ amount: "12.50", categoryId: "groceries", note: "压测预置账目" }),
});

const scenarios = [
  await runScenario("GET /api/moods?limit=8", {
    url: `${baseUrl}/api/moods?limit=8`,
    connections: 12,
    duration: 8,
    headers: { Cookie: cookie },
  }),
  await runScenario("GET /api/expenses/grouped", {
    url: `${baseUrl}/api/expenses/grouped`,
    connections: 12,
    duration: 8,
    headers: { Cookie: cookie },
  }),
  await runScenario("POST /api/moods", {
    url: `${baseUrl}/api/moods`,
    method: "POST",
    connections: 6,
    duration: 8,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ moodKey: "rest" }),
  }),
];

const summary = {
  baseUrl,
  username,
  executedAt: new Date().toISOString(),
  scenarios,
};

fs.writeFileSync(path.join(outputDir, "load-test-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
