import type { Page } from '@playwright/test';
import { adminUser } from '../fixtures/testData';

export async function waitForHydrate(page: Page) {
  await page.waitForFunction(() => typeof window?.useNuxtApp === 'function');
}

export async function fillInput(page: Page, selector: string, value: string) {
  await waitForHydrate(page);
  const input = await page.locator(selector);
  await input.clear();
  await page.waitForTimeout(100);
  await input.click();
  await input.pressSequentially(value, { delay: 50 });
  const currentVal = await input.inputValue();

  if (currentVal !== value) {
    await fillInput(page, selector, value);
  }
}

export async function login(page: Page, email = adminUser.email, password = adminUser.password, waitForRedirect = true) {
  await page.goto('/auth/login');
  await fillInput(page, 'input[type="email"]', email);
  await fillInput(page, 'input[type="password"]', password);
  await page.click('button[type="submit"]');
  if (waitForRedirect) {
    await page.waitForURL('/');
  }
}

export async function logout(page: Page) {
  await page.click('text=Profile');
  await page.click('text=Sign Out');
  await page.waitForURL('/auth/login');
}

export async function createSite(page: Page, name: string, url: string) {
  await page.goto('/sites/add');
  await fillInput(page, 'input[placeholder="Site Name"]', name);
  await fillInput(page, 'input[placeholder="https://example.com"]', url);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function deleteSite(page: Page, name: string) {
  await page.goto('/');
  await waitForHydrate(page);
  await page.click(`text=${name}`);
  page.once('dialog', (dialog) => dialog.accept());
  await page.click('button:has-text("Delete")');
  await page.waitForURL('/');
  await waitForHydrate(page);
}
