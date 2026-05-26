import { expect, test, type Page } from "@playwright/test";

const operatorEmail = process.env.E2E_TENANCY_EMAIL ?? "admin@example.com";
const operatorPassword = process.env.E2E_TENANCY_PASSWORD ?? "password123";

async function signIn(page: Page) {
  await page.goto("/en/login");
  await page.getByRole("textbox").nth(0).fill(operatorEmail);
  await page.getByRole("textbox").nth(1).fill(operatorPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en(?:$|[/?#])/);
  await expect(page.getByText("Active tenants")).toBeVisible({
    timeout: 20_000,
  });
}

test("redirects protected tenancy pages to login", async ({ page }) => {
  await page.goto("/en/tenants");

  await expect(page).toHaveURL(/\/en\/login/);
  await expect(page.getByText("System operator sign in")).toBeVisible();
  await expect(page.getByRole("textbox").nth(0)).toBeVisible();
  await expect(page.getByRole("textbox").nth(1)).toBeVisible();
});

test("shows validation on empty login submit", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText(/invalid|required|email/i).first()).toBeVisible();
});

test.describe("authenticated tenancy screens", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  const screens = [
    { path: "/en", text: "Active tenants" },
    { path: "/en/tenants", text: "Tenants" },
    { path: "/en/tenants/new", text: "Create tenant and owner" },
    { path: "/en/owners", text: "Owner" },
    { path: "/en/settings", text: "Settings" },
  ];

  for (const screen of screens) {
    test(`renders ${screen.path}`, async ({ page }) => {
      await page.goto(screen.path);

      await expect(page.getByText(screen.text).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.locator("body")).not.toContainText(
        "Application error",
      );
    });
  }

  test("validates the create tenant form before submission", async ({ page }) => {
    await page.goto("/en/tenants/new");
    await page.locator("form").getByRole("button", { name: "Create tenant" }).click();

    await expect(page.getByText(/required|invalid|string/i).first()).toBeVisible();
  });
});
