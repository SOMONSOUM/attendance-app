import { expect, type Page, test } from "@playwright/test";

async function dismissWarningDialog(page: Page) {
  const dialog = page.locator(
    '[role="dialog"][aria-labelledby="scan-warning-title"]',
  );

  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "OK" }).click({ force: true });
  await expect(dialog).toBeHidden({ timeout: 5_000 });
}

test("renders the localized public entry page", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByText("Locale Page")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("renders a seeded bulk event QR screen and searches attendees", async ({
  page,
}) => {
  await page.goto("/en/scan/DEMO-TECH-SUMMIT-2026");

  await expect(page.getByRole("heading", { name: "Khmer Tech Summit 2026" }))
    .toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Bulk registration")).toBeVisible();

  await dismissWarningDialog(page);

  await page.getByPlaceholder("Search English or Khmer name").click();
  await page
    .getByPlaceholder("Search English or Khmer name")
    .pressSequentially("Chan");
  await expect(page.getByText("Chan Sophea")).toBeVisible({ timeout: 20_000 });
});

test("renders an open event QR screen with registration fields", async ({
  page,
}) => {
  await page.goto("/en/scan/DEMO-COMMUNITY-OPEN-DAY-2026");

  await expect(page.getByRole("heading", { name: "Community Open Day 2026" }))
    .toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Open registration")).toBeVisible();
  await page.getByPlaceholder("Full name English").click();
  await page
    .getByPlaceholder("Full name English")
    .pressSequentially("UI Test Visitor");
  await page.getByPlaceholder("Position").click();
  await page.getByPlaceholder("Position").pressSequentially("QA Visitor");
  await page.getByPlaceholder("Full name Khmer").fill("UI Test Visitor Khmer");
  await page.getByPlaceholder("Organization").fill("QA Organization");
  await page.getByPlaceholder("Phone number").fill("+855 12 345 678");

  await expect(page.getByRole("button", { name: "Join event" })).toBeEnabled();
});

test("renders a seeded meeting QR screen and filters participants", async ({
  page,
}) => {
  await page.goto("/en/meeting-scan/DEMO-MEETING-BUDGET-ROOM");

  await expect(
    page.getByRole("heading", { name: "Committee Workshops 2026" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Budget Room")).toBeVisible();

  await page.getByPlaceholder("Search your name").click();
  await page.getByPlaceholder("Search your name").pressSequentially("Bora");
  await expect(page.getByText("Bora Seng")).toBeVisible({ timeout: 10_000 });
});

test("renders a pre-registration meeting QR screen", async ({ page }) => {
  await page.goto("/en/meeting-scan/DEMO-RESEARCH-ROUNDTABLE-2026");

  await expect(
    page.getByRole("heading", { name: "Research Roundtable 2026" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Registration details")).toBeVisible();
  await page.getByPlaceholder("Full name in English").click();
  await page
    .getByPlaceholder("Full name in English")
    .pressSequentially("UI Test Participant");
  await page.getByPlaceholder("Full name in Khmer").fill("UI Test Participant Khmer");
  await page.getByPlaceholder("Position").fill("QA Participant");
  await page.getByPlaceholder("Organization").fill("QA Organization");
  await page.getByPlaceholder("Phone number").fill("+855 12 345 678");
  await expect(page.getByRole("button", { name: "Check in" })).toBeEnabled();
});
