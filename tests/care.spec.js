import { expect, test } from "@playwright/test";

async function register(page, username, password) {
  await page.goto("/");
  await page.getByTestId("auth-username").fill(username);
  await page.getByTestId("auth-password").fill(password);
  await page.getByRole("button", { name: "注册" }).click();
  await page.getByTestId("auth-submit").click();
}

async function createHousehold(page, name) {
  await page.getByTestId("create-household-name").fill(name);
  await page.getByTestId("create-household-submit").click();
  await expect(page.getByRole("heading", { name: /早上好呀/ })).toBeVisible();
}

async function logout(page) {
  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page.getByTestId("auth-username")).toBeVisible();
}

test("家人回复端可以邀请、加入并回复成员心情", async ({ page }) => {
  const stamp = Date.now().toString(36);

  await register(page, `o_${stamp}`, "secret123");
  await createHousehold(page, `家庭_${stamp}`);
  await page.goto("/care");

  await page.getByTestId("care-invite-role").selectOption("member");
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(page.getByText("邀请码已生成。")).toBeVisible();
  const memberCode = (await page.getByTestId("invite-code").first().textContent())?.trim();

  await page.getByTestId("care-invite-role").selectOption("caregiver");
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(page.getByText("邀请码已生成。")).toBeVisible();
  const caregiverCode = (await page.getByTestId("invite-code").first().textContent())?.trim();

  await logout(page);

  await register(page, `m_${stamp}`, "secret123");
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

  await register(page, `c_${stamp}`, "secret123");
  await expect(page.getByTestId("join-household-code")).toBeVisible();
  await page.getByTestId("join-household-code").fill(caregiverCode || "");
  await page.getByTestId("join-household-submit").click();
  await page.goto("/care");
  await expect(page.getByTestId("care-mood-item").first()).toBeVisible();
  await page.getByTestId("care-reply-input").fill("已经看到这条心情了，先慢一点，照顾好自己。");
  await page.getByTestId("care-reply-submit").click({ force: true });
  await expect(page.getByText("已经看到这条心情了，先慢一点，照顾好自己。")).toBeVisible();
  await logout(page);

  await page.getByTestId("auth-username").fill(`m_${stamp}`);
  await page.getByTestId("auth-password").fill("secret123");
  await page.getByTestId("auth-submit").click();
  await expect(page.getByText("已经看到这条心情了，先慢一点，照顾好自己。")).toBeVisible();
});

test("不同家庭之间的回复端数据隔离", async ({ page }) => {
  const stamp = Date.now().toString(36);

  await register(page, `owner_a_${stamp}`, "secret123");
  await createHousehold(page, `家庭A_${stamp}`);
  await page.goto("/care");

  await page.getByTestId("care-invite-role").selectOption("member");
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(page.getByText("邀请码已生成。")).toBeVisible();
  const memberCode = (await page.getByTestId("invite-code").first().textContent())?.trim();

  await page.getByTestId("care-invite-role").selectOption("caregiver");
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(page.getByText("邀请码已生成。")).toBeVisible();
  const caregiverACode = (await page.getByTestId("invite-code").first().textContent())?.trim();

  await logout(page);

  await register(page, `member_a_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(memberCode || "");
  await page.getByTestId("join-household-submit").click();
  await page.getByTestId("mood-bad").click();
  await logout(page);

  await register(page, `owner_b_${stamp}`, "secret123");
  await createHousehold(page, `家庭B_${stamp}`);
  await page.goto("/care");
  await page.getByTestId("care-invite-role").selectOption("caregiver");
  await page.getByTestId("care-create-invite").click({ force: true });
  await expect(page.getByText("邀请码已生成。")).toBeVisible();
  const caregiverBCode = (await page.getByTestId("invite-code").first().textContent())?.trim();
  await logout(page);

  await register(page, `care_b_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(caregiverBCode || "");
  await page.getByTestId("join-household-submit").click();
  await page.goto("/care");
  await expect(page.getByText(`member_a_${stamp}`)).not.toBeVisible();

  await logout(page);

  await register(page, `care_a_${stamp}`, "secret123");
  await page.getByTestId("join-household-code").fill(caregiverACode || "");
  await page.getByTestId("join-household-submit").click();
  await page.goto("/care");
  await expect(page.getByTestId("care-mood-item").first()).toContainText(`member_a_${stamp}`);
});
