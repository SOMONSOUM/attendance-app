import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const skipWebServer = process.env.PLAYWRIGHT_NO_WEB_SERVER === "true";

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
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
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: `npx next start -H localhost -p ${port}`,
        url: `http://localhost:${port}`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
