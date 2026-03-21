import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const outputDir = path.resolve("test-artifacts", "screenshots");
fs.mkdirSync(outputDir, { recursive: true });

test("登录、自定义心情、打卡和记账主链路截图", async ({ page }) => {
  const stamp = Date.now().toString(36);
  const username = `ui_${stamp}`;
  const password = "uitest123";

  await page.goto("/");
  await expect(page.getByText("登录后开始记录今天")).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "01-login.png"), fullPage: true });

  await page.getByRole("button", { name: "注册" }).click();
  await page.getByPlaceholder("2 到 20 位中文、字母、数字、下划线或短横线").fill(username);
  await page.getByPlaceholder("至少 6 位").fill(password);
  await page.getByRole("button", { name: "创建账号并进入" }).click();

  await expect(page.getByText("今天感觉怎么样")).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "02-home.png"), fullPage: true });

  await page.getByRole("button", { name: "＋ 添加心情" }).click();
  await page.getByPlaceholder("例如：踏实、挂念、想出门").fill("想散步");
  await page.getByRole("button", { name: "🙂" }).click();
  await page.getByRole("button", { name: "确认添加" }).click();
  await expect(page.getByText("已添加心情“想散步”。")).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "03-custom-mood-added.png"), fullPage: true });

  await page.getByRole("button", { name: /想散步/ }).click();
  await expect(page.getByText("已记录 ✓")).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "04-custom-mood-toast.png"), fullPage: true });

  await page.getByRole("button", { name: /养生/ }).click();
  await expect(page.getByRole("button", { name: /今天来打卡|今天已经打卡/ })).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "05-wellness.png"), fullPage: true });

  const checkinButton = page.getByRole("button", { name: "🌱 今天来打卡" });
  if (await checkinButton.isVisible().catch(() => false)) {
    await checkinButton.click();
  }
  await page.screenshot({ path: path.join(outputDir, "06-checkin.png"), fullPage: true });

  await page.getByRole("button", { name: /记账/ }).click();
  await page.getByPlaceholder("0.00").fill("36.80");
  await page.getByRole("button", { name: /买菜/ }).click();
  await page.getByPlaceholder("这笔花费用来做什么，可以不填").fill("截图验证账目");
  await page.getByRole("button", { name: "✅ 记下来" }).click();
  await expect(page.getByText("共 1 笔 · ¥ 36.80")).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "07-expense.png"), fullPage: true });
});
