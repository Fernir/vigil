import puppeteer from "puppeteer";
import { Buffer } from "node:buffer";

export interface UnifiedMetrics {
  loadTime: number;
  ttfb: number;
  domContentLoaded: number;
  pageSize: number;
  requestCount: number;
  screenshotBuffer: Buffer;
  width: number;
  height: number;
  error?: string;
}

export async function checkSiteUnified(
  url: string,
  options: {
    viewportWidth?: number;
    viewportHeight?: number;
    fullPage?: boolean;
    timeout?: number;
  } = {},
): Promise<UnifiedMetrics | null> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    const viewportWidth = options.viewportWidth || 1280;
    const viewportHeight = options.viewportHeight || 800;

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: 1,
    });

    let requestCount = 0;
    let totalPageSize = 0;

    page.on("request", () => {
      requestCount++;
    });

    page.on("response", async (response) => {
      try {
        const buffer = await response.buffer();
        totalPageSize += buffer.length;
      } catch (e) {
        // Ignore errors for individual responses
      }
    });

    const navigationStart = Date.now();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: options.timeout || 30000,
    });
    const loadTime = Date.now() - navigationStart;

    const ttfb = await page
      .evaluate(() => {
        const navEntry = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        return navEntry ? navEntry.responseStart : 0;
      })
      .catch(() => 0);

    const domContentLoaded = await page
      .evaluate(() => {
        const navEntry = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        return navEntry ? navEntry.domContentLoadedEventEnd : 0;
      })
      .catch(() => 0);

    const screenshotBuffer = (await page.screenshot({
      fullPage: options.fullPage || false,
      type: "png",
    })) as Buffer;

    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));

    await browser.close();

    return {
      loadTime,
      ttfb,
      domContentLoaded,
      pageSize: Math.round(totalPageSize / 1024),
      requestCount,
      screenshotBuffer,
      width: options.fullPage ? dimensions.width : viewportWidth,
      height: options.fullPage ? dimensions.height : viewportHeight,
    };
  } catch (error: any) {
    console.error(`Unified check failed for ${url}:`, error.message);
    await browser.close().catch(() => {});
    return {
      loadTime: 0,
      ttfb: 0,
      domContentLoaded: 0,
      pageSize: 0,
      requestCount: 0,
      screenshotBuffer: Buffer.from(""),
      width: 0,
      height: 0,
      error: error.message,
    };
  }
}
