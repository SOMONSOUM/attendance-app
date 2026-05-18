import { defineConfig, devices } from "@playwright/test";

const attendanceUrl = process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const adminUrl = process.env.ADMIN_APP_URL ?? "http://localhost:3002";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: adminUrl },
    },
    {
      name: "attendance",
      testMatch: /attendance\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: attendanceUrl },
    },
    {
      name: "api",
      testMatch: /api\.spec\.ts/,
      use: { baseURL: apiUrl },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @attendance/api dev",
      url: `${apiUrl}/api/docs/json`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @attendance/admin dev",
      url: adminUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @attendance/attendance dev",
      url: attendanceUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
