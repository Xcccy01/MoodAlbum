import http from "node:http";
function request(path, body, cookies = "") {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: 8787, path, method: "POST", headers: { "Content-Type": "application/json", ...(cookies ? { Cookie: cookies } : {}) } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}
const stamp = Date.now().toString(36);
const reg = await request("/api/auth/register", { username: `raw_${stamp}`, password: "dual1234" });
const userCookie = reg.headers["set-cookie"][0].split(";")[0];
const adm = await request("/api/admin/login", { passcode: process.env.ADMIN_PASSCODE || "123456" }, userCookie);
const combined = [userCookie, adm.headers["set-cookie"][0].split(";")[0]].join("; ");
const authSession = await new Promise((resolve, reject) => {
  http.get({ hostname: "127.0.0.1", port: 8787, path: "/api/auth/session", headers: { Cookie: combined } }, (res) => { const chunks=[]; res.on("data", c => chunks.push(c)); res.on("end", ()=> resolve(Buffer.concat(chunks).toString("utf8"))); }).on("error", reject);
});
const adminSession = await new Promise((resolve, reject) => {
  http.get({ hostname: "127.0.0.1", port: 8787, path: "/api/admin/session", headers: { Cookie: combined } }, (res) => { const chunks=[]; res.on("data", c => chunks.push(c)); res.on("end", ()=> resolve(Buffer.concat(chunks).toString("utf8"))); }).on("error", reject);
});
console.log(JSON.stringify({ regHeaders: reg.headers["set-cookie"], admHeaders: adm.headers["set-cookie"], authSession, adminSession }, null, 2));
