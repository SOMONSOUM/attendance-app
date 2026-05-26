import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3002);

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  timeout: 90_000,
  reporter: [["html"], ["list"]],
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- -H localhost`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
