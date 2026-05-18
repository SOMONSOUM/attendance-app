import { expect, test } from "@playwright/test";

test.describe("admin app", () => {
  test("redirects protected pages to login", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(
      page.getByRole("heading", { name: "Admin sign in" }),
    ).toBeVisible();
  });

  test("shows login validation failure from API", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("missing@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText(/Invalid credentials|Unable to login/),
    ).toBeVisible();
  });
});
