import { test, expect } from '@playwright/test';
import { login, createSite, deleteSite, waitForHydrate, fillInput } from './helpers/auth';

test.describe('Site Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display sites list', async ({ page }) => {
    await page.goto('/');
    await waitForHydrate(page);
    await expect(page.locator('text="All services"')).toBeVisible();
  });

  test('should add new site', async ({ page }) => {
    await createSite(page, 'Test Site for Add', 'https://example.com');
    await expect(page.locator('text=Test Site for Add').first()).toBeVisible();
    await deleteSite(page, 'Test Site for Add');
  });

  test('should edit site', async ({ page }) => {
    await createSite(page, 'Test Site for Edit', 'https://test-site.com');
    await page.goto('/');
    await waitForHydrate(page);

    await page.locator('text=Test Site for Edit').first().click();
    await expect(page.locator('[placeholder="Site name"]')).not.toHaveValue('');
    await fillInput(page, '[placeholder="Site name"]', 'Test Site for Edit Updated Name');
    await page.click('button:has-text("Save")');
    await page.waitForURL('/');
    await expect(page.locator('text=Test Site for Edit Updated Name')).toBeVisible();
    await deleteSite(page, 'Test Site for Edit Updated Name');
  });

  test('should delete site', async ({ page }) => {
    await createSite(page, 'Test Site for Delete', 'https://test-site.com');
    await page.goto('/');
    await waitForHydrate(page);
    await page.click('text=Test Site for Delete');
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button[aria-label="Delete site"], button:has-text("Delete")');
    await page.waitForURL('/');
    await waitForHydrate(page);
    await expect(page.locator('text=Test Site for Delete').first()).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/sites/add');
    await waitForHydrate(page);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text="URL must start with http:// or https://"')).toBeVisible();
  });

  test('should validate URL format', async ({ page }) => {
    await page.goto('/sites/add');
    await waitForHydrate(page);
    await fillInput(page, 'input[placeholder="Site Name"]', 'Invalid URL');

    await page.locator('input[placeholder="https://example.com"]').click();
    await page.locator('input[placeholder="https://example.com"]').clear();
    await fillInput(page, 'input[placeholder="https://example.com"]', 'not-a-url');
    await page.click('button[type="submit"]');
    await expect(page.locator('text="URL must start with http:// or https://"')).toBeVisible();
  });
});
