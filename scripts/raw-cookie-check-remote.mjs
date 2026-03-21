import http from "node:http";
function request(path, body, cookies = "") {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "YOUR_SERVER_IP", port: 80, path, method: "POST", headers: { "Content-Type": "application/json", ...(cookies ? { Cookie: cookies } : {}) } }, (res) => {
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
const reg = await request("/api/auth/register", { username: `keep_${stamp}`, password: "dual1234" });
const userCookie = reg.headers["set-cookie"][0].split(";")[0];
const adm = await request("/api/admin/login", { passcode: process.env.ADMIN_PASSCODE }, userCookie);
const combined = [userCookie, adm.headers["set-cookie"][0].split(";")[0]].join("; ");
function get(path, cookies) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "YOUR_SERVER_IP", port: 80, path, headers: { Cookie: cookies } }, (res) => { const chunks=[]; res.on("data", c => chunks.push(c)); res.on("end", ()=> resolve(Buffer.concat(chunks).toString("utf8"))); }).on("error", reject);
  });
}
const authSession = await get("/api/auth/session", combined);
const adminSession = await get("/api/admin/session", combined);
console.log(JSON.stringify({ authSession, adminSession }, null, 2));
