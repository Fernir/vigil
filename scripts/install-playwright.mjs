#!/usr/bin/env node
/**
 * Ставит только Chromium для мониторинга (server/plugins/browser.ts).
 * В CI/Docker без браузера: PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
 */
import { execSync } from "node:child_process";

if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1") {
  console.log("[postinstall] Skip Playwright browsers (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1)");
  process.exit(0);
}

execSync("npx playwright install chromium", { stdio: "inherit" });
