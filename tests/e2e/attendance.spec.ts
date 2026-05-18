import { expect, test } from "@playwright/test";

test.describe("attendance app", () => {
  test("keeps scan search query in the URL with nuqs", async ({ page }) => {
    await page.route("**/api/events/qr/**", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: "clxevent001",
            name: "Khmer Tech Summit 2026",
            mode: "PRE_REGISTERED",
            locationName: "Phnom Penh Convention Center",
            startsAt: "2026-06-01T01:30:00.000Z",
            endsAt: "2026-06-01T10:30:00.000Z",
            theme: null,
          },
          timestamp: "2026-05-18T03:00:00.000Z",
          path: "/api/events/qr/test-code",
        },
      });
    });
    await page.route(
      "**/api/events/*/registrations/search**",
      async (route) => {
        await route.fulfill({
          json: {
            success: true,
            data: [
              {
                id: "clxregistration001",
                fullNameEn: "Sok Dara",
                fullNameKm: "សុខ ដារ៉ា",
                department: "Technology",
              },
            ],
            timestamp: "2026-05-18T03:00:00.000Z",
            path: "/api/events/clxevent001/registrations/search",
          },
        });
      },
    );

    await page.goto("/en/scan/test-code");
    await page.getByPlaceholder("Search English or Khmer name").fill("Sok");
    await expect(page).toHaveURL(/q=Sok/);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Sok Dara")).toBeVisible();
  });
});
