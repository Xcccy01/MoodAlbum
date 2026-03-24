import { expect, test } from "@playwright/test";

async function register(page, path, username, password) {
  await page.goto(path);
  await page.getByTestId("auth-username").fill(username);
  await page.getByTestId("auth-password").fill(password);
  await page.getByRole("button", { name: "注册" }).click();
  await page.getByTestId("auth-submit").click();
}

async function createHousehold(page, name) {
  await page.getByTestId("create-household-name").fill(name);
  await page.getByTestId("create-household-submit").click();
}

test("公开版成员主链路可用", async ({ page }) => {
  const stamp = Date.now().toString(36);
  await register(page, "/care", `owner_${stamp}`, "secret123");
  await createHousehold(page, `家庭_${stamp}`);
  await page.getByTestId("open-member-app").click();
  await expect(page.getByRole("heading", { name: /早上好呀/ })).toBeVisible();
  await page.getByTestId("open-care-app").click();
  await expect(page.getByRole("heading", { name: /手动回复心情诉求/ })).toBeVisible();
  await page.goto("/care");
  await page.getByTestId("care-invite-role").selectOption("member");
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(page.getByText("邀请码已生成。")).toBeVisible();
  const memberCode = (await page.getByTestId("invite-code").first().textContent())?.trim();

  await page.getByRole("button", { name: "退出登录" }).click();
  await register(page, "/", `member_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(memberCode || "");
  await page.getByTestId("join-household-submit").click();

  await expect(page.getByRole("heading", { name: /早上好呀/ })).toBeVisible();

  await page.getByTestId("mood-happy").click();
  await expect(page.getByText("心情已记录。")).toBeVisible();
  await expect(page.getByTestId("mood-history-item")).toHaveCount(1);

  await page.getByRole("button", { name: "养生" }).click();
  await page.getByTestId("checkin-button").click();
  await expect(page.getByText("今天已经打卡。")).toBeVisible();

  await page.getByRole("button", { name: "记账" }).click();
  await page.getByTestId("expense-amount").fill("36.80");
  await page.getByRole("button", { name: /买菜/ }).click();
  await page.getByTestId("expense-submit").click();
  await expect(page.getByText("账目已记录。")).toBeVisible();
  await expect(page.getByText("共 1 笔 · ¥ 36.80")).toBeVisible();
});
