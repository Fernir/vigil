import puppeteer from "puppeteer";
import type { Buffer } from "node:buffer";

export interface ScreenshotOptions {
  viewportWidth?: number;
  viewportHeight?: number;
  fullPage?: boolean;
  format?: "png" | "jpeg" | "webp";
  blockAds?: boolean;
  blockCookieBanners?: boolean;
  delay?: number;
  userAgent?: string;
}

export interface ScreenshotResult {
  imageBuffer: Buffer;
  width: number;
  height: number;
}

export async function takeScreenshot(
  url: string,
  options: ScreenshotOptions = {},
): Promise<ScreenshotResult | null> {
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
    await page.setViewport({
      width: options.viewportWidth || 1280,
      height: options.viewportHeight || 800,
      deviceScaleFactor: 1,
    });

    if (options.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    // Get screenshot as Buffer
    const screenshotBuffer = (await page.screenshot({
      fullPage: options.fullPage || false,
      type: options.format === "jpeg" ? "jpeg" : "png",
    })) as Buffer;

    // Get page dimensions
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));

    await browser.close();

    return {
      imageBuffer: screenshotBuffer,
      width: options.fullPage
        ? dimensions.width
        : options.viewportWidth || 1280,
      height: options.fullPage
        ? dimensions.height
        : options.viewportHeight || 800,
    };
  } catch (error) {
    console.error(`Failed to take screenshot for ${url}:`, error);
    await browser.close().catch(() => {});
    return null;
  }
}
