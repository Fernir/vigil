import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

export interface ScreenshotOptions {
  viewportWidth?: number;
  viewportHeight?: number;
  fullPage?: boolean;
  format?: "png" | "jpeg" | "webp";
  blockAds?: boolean; // Puppeteer does not block ads without additional plugins
  blockCookieBanners?: boolean; // also not standard, would require custom logic
  delay?: number; // delay before taking screenshot (ms)
  userAgent?: string;
}

export async function takeAndSaveScreenshot(
  siteId: number,
  url: string,
  options: ScreenshotOptions = {},
): Promise<{
  width: number;
  height: number;
  filename: string;
} | null> {
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

    // Set viewport
    await page.setViewport({
      width: options.viewportWidth || 1280,
      height: options.viewportHeight || 800,
      deviceScaleFactor: 1,
    });

    // If userAgent is specified, set it
    if (options.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    // Navigate to the page
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    if (!response) {
      throw new Error("No response");
    }

    // Wait for the delay, if specified
    if (options.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    // Make the screenshot
    const fileName = `site-${siteId}-${Date.now()}.${options.format || "png"}`;
    const publicDir = path.resolve(process.cwd(), "public/screenshots");
    const filePath = path.join(publicDir, fileName);

    await fs.mkdir(publicDir, { recursive: true });

    const screenshotBuffer = await page.screenshot({
      fullPage: options.fullPage || false,
      type: options.format === "jpeg" ? "jpeg" : "png",
    });

    await fs.writeFile(filePath, screenshotBuffer);

    // Get dimensions of the page
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));

    await browser.close();

    return {
      filename: `/screenshots/${fileName}`,
      width: options.fullPage
        ? dimensions.width
        : options.viewportWidth || 1280,
      height: options.fullPage
        ? dimensions.height
        : options.viewportHeight || 800,
    };
  } catch (error) {
    console.error(`❌ Failed to take screenshot for ${url}:`, error);
    await browser.close().catch(() => {});
    return null;
  }
}
