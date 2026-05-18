import { expect, test } from "@playwright/test";

test.describe("api documentation", () => {
  test("serves swagger json with documented auth and attendance paths", async ({
    request,
  }) => {
    const response = await request.get("/api/docs/json");
    expect(response.ok()).toBeTruthy();

    const document = await response.json();
    expect(document.info.title).toBe("Attendance Platform API");
    expect(document.paths["/api/auth/login"]).toBeTruthy();
    expect(document.paths["/api/attendance/qr/{code}/join"]).toBeTruthy();
  });

  test("formats validation errors for frontend consumption", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/login", {
      data: { email: "not-an-email", password: 123 },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("email");
  });
});
