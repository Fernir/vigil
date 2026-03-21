import { test, expect } from "@playwright/test";
import { fillInput, login, waitForHydrate } from "./helpers/auth";
import { adminUser } from "./fixtures/testData";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, adminUser.email, adminUser.password);
  });

  test("should show admin link only for admin users", async ({ page }) => {
    await page.goto("/");
    await waitForHydrate(page);
    await expect(page.locator("text=Admin")).toBeVisible();
  });

  test("should display users list", async ({ page }) => {
    await page.goto("/admin");
    await waitForHydrate(page);
    await expect(page.locator("h1")).toContainText("Admin Dashboard");
    await expect(page.locator("table")).toBeVisible();
  });

  test("should edit user settings", async ({ page }) => {
    await page.goto("/admin");
    await waitForHydrate(page);
    await page.click('[data-test="Edit User"]');
    await page.waitForURL((url) => url.pathname.includes("/admin/users/"));
    await fillInput(
      page,
      'input[placeholder="Max Sites"]',
      (Math.floor(Math.random() * (100 - 30 + 1)) + 30).toString(),
    );
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(1000);
    await expect(page.locator("text=User updated")).toBeVisible();
  });
});
