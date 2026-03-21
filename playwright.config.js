import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:8790",
    trace: "retain-on-failure",
    screenshot: "off",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        channel: "msedge",
        ...devices["iPhone 13"],
      },
    },
  ],
});
