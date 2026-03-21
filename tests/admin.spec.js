import { test, expect } from "@playwright/test";

test("后台可以登录并回复最新心情", async ({ page, request }) => {
  const username = `adm_${Date.now().toString(36)}`;
  const password = "adminreply123";

  const register = await request.post("/api/auth/register", {
    data: { username, password },
  });
  expect(register.ok()).toBeTruthy();

  const mood = await request.post("/api/moods", {
    data: { moodKey: "bad" },
  });
  expect(mood.ok()).toBeTruthy();

  await page.goto("/admin");
  await page.getByPlaceholder("请输入口令").fill(process.env.ADMIN_PASSCODE || "123456");
  await page.getByRole("button", { name: "进入后台" }).click();
  await expect(page.getByText("手动回复心情诉求")).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(username) }).first()).toBeVisible();

  await page.locator("textarea").fill("已经看到这条心情了，先慢一点，照顾好自己。");
  await page.getByRole("button", { name: "发布回复" }).click();
  await expect(page.getByText("回复已发布。")).toBeVisible();
});
