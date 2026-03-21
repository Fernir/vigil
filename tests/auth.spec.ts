import { test, expect } from "@playwright/test";
import { login, logout } from "./helpers/auth";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("h2")).toContainText("Sign in");
    // Check for input fields - adjust selectors based on actual HTML
    await expect(
      page.locator('input[placeholder="you@example.com"]'),
    ).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1")).toContainText("Services average status");
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await login(page, "wrong@example.com", "wrongpass", false);
    await expect(page.locator("[data-test]")).toContainText(
      "Invalid email or password",
    );
  });

  test("should logout successfully", async ({ page }) => {
    await login(page);
    await logout(page);
    await expect(page).toHaveURL("/auth/login");
  });
});
