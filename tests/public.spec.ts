import { test, expect } from "@playwright/test";

test.describe("Public Status Page", () => {
  test("should display system status", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Services average status");
    await expect(page.locator("text=Overall Uptime")).toBeVisible();
    await expect(page.locator("text=Operational")).toBeVisible();
  });

  test("should show SSE connection status", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Live updates connected")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should not show site list for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("text=All services")).not.toBeVisible();
  });
});
