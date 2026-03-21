import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Real-time Updates", () => {
  test("should receive SSE updates on dashboard", async ({ page }) => {
    await login(page);

    await expect(page.locator("text=Live updates connected")).toBeVisible({
      timeout: 10000,
    });
  });
});
