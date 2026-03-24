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
  await expect(page.getByRole("heading", { name: /手动回复心情诉求/ })).toBeVisible();
}

async function createInvite(page, role) {
  const codes = page.getByTestId("invite-code");
  const previousCount = await codes.count();

  await page.getByTestId("care-invite-role").selectOption(role);
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(codes).toHaveCount(previousCount + 1);

  return ((await codes.first().textContent()) || "").trim();
}

async function logout(page) {
  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page.getByTestId("auth-username")).toBeVisible();
}

test("家人回复端可以邀请、加入并回复成员心情", async ({ page }) => {
  const stamp = Date.now().toString(36);

  await register(page, "/care", `o_${stamp}`, "secret123");
  await createHousehold(page, `家庭_${stamp}`);

  const memberCode = await createInvite(page, "member");
  const caregiverCode = await createInvite(page, "caregiver");

  await logout(page);

  await register(page, "/", `m_${stamp}`, "secret123");
  await expect(page.getByTestId("join-household-code")).toBeVisible();
  await page.getByTestId("join-household-code").fill(memberCode || "");
  await page.getByTestId("join-household-submit").click();
  await expect(page.getByRole("heading", { name: /早上好呀/ })).toBeVisible();

  await page.goto("/care");
  await expect(page.getByText("这个入口只对家人回复者开放")).toBeVisible();
  await page.goto("/");
  await page.getByTestId("mood-bad").click();
  await expect(page.getByText("心情已记录。")).toBeVisible();
  await logout(page);

  await register(page, "/care", `c_${stamp}`, "secret123");
  await expect(page.getByTestId("join-household-code")).toBeVisible();
  await page.getByTestId("join-household-code").fill(caregiverCode || "");
  await page.getByTestId("join-household-submit").click();
  await expect(page.getByRole("heading", { name: /手动回复心情诉求/ })).toBeVisible();
  await expect(page.getByTestId("care-mood-item").first()).toBeVisible();
  await page.getByTestId("care-reply-input").fill("已经看到这条心情了，先慢一点，照顾好自己。");
  await page.getByTestId("care-reply-submit").click({ force: true });
  await expect(page.getByText("已经看到这条心情了，先慢一点，照顾好自己。")).toBeVisible();
  await logout(page);

  await page.getByTestId("auth-username").fill(`m_${stamp}`);
  await page.getByTestId("auth-password").fill("secret123");
  await page.getByTestId("auth-submit").click();
  await expect(
    page
      .getByTestId("mood-history-item")
      .filter({ hasText: "已经看到这条心情了，先慢一点，照顾好自己。" })
      .first()
  ).toBeVisible();
});

test("不同家庭之间的回复端数据隔离", async ({ page }) => {
  const stamp = Date.now().toString(36);

  await register(page, "/care", `owner_a_${stamp}`, "secret123");
  await createHousehold(page, `家庭A_${stamp}`);

  const memberCode = await createInvite(page, "member");
  const caregiverACode = await createInvite(page, "caregiver");

  await logout(page);

  await register(page, "/", `member_a_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(memberCode || "");
  await page.getByTestId("join-household-submit").click();
  await page.getByTestId("mood-bad").click();
  await logout(page);

  await register(page, "/care", `owner_b_${stamp}`, "secret123");
  await createHousehold(page, `家庭B_${stamp}`);
  const caregiverBCode = await createInvite(page, "caregiver");
  await logout(page);

  await register(page, "/care", `care_b_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(caregiverBCode || "");
  await page.getByTestId("join-household-submit").click();
  await expect(page.getByRole("heading", { name: /手动回复心情诉求/ })).toBeVisible();
  await expect(page.getByText(`member_a_${stamp}`)).not.toBeVisible();

  await logout(page);

  await register(page, "/care", `care_a_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(caregiverACode || "");
  await page.getByTestId("join-household-submit").click();
  await expect(page.getByRole("heading", { name: /手动回复心情诉求/ })).toBeVisible();
  await expect(page.getByTestId("care-mood-item").first()).toContainText(`member_a_${stamp}`);
});
