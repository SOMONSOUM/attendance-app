import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "password123";

async function signIn(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByPlaceholder("Enter your password").fill(adminPassword);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await expect(page).toHaveURL(/\/en(?:$|[/?#])/);
  await expect(page.getByRole("heading", { name: "Operations overview" })).toBeVisible({
    timeout: 20_000,
  });
}

test("redirects protected pages to the admin login", async ({ page }) => {
  await page.goto("/en/events");

  await expect(page).toHaveURL(/\/en\/login/);
  await expect(page.getByText("Admin sign in")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
});

test("shows client-side validation on empty login submit", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: /^Sign in$/ }).click();

  await expect(page.getByText(/invalid|required|email/i).first()).toBeVisible();
});

test.describe("authenticated admin screens", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  const screens = [
    { path: "/en", text: "Operations overview" },
    { path: "/en/events", text: "Events" },
    { path: "/en/meetings", text: "Meetings" },
    { path: "/en/registrations", text: "Registrations" },
    { path: "/en/attendance", text: "Attendance" },
    { path: "/en/people", text: "People" },
    { path: "/en/roles", text: "Roles & permissions" },
    { path: "/en/theme", text: "Theme" },
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

  test("keeps the navigation shell usable across major sections", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /Events/ }).click();
    await expect(page).toHaveURL(/\/en\/events/);
    await expect(page.getByText("Events").first()).toBeVisible();

    await page.getByRole("link", { name: /Meetings/ }).click();
    await expect(page).toHaveURL(/\/en\/meetings/);
    await expect(page.getByText("Meetings").first()).toBeVisible();

    await page.getByRole("link", { name: /Settings/ }).click();
    await expect(page).toHaveURL(/\/en\/settings/);
    await expect(page.getByText("Settings").first()).toBeVisible();
  });
});
