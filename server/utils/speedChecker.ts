import puppeteer from "puppeteer";

export interface SpeedResult {
  loadTime: number;
  ttfb: number;
  domContentLoaded: number;
  pageSize: number; // in bytes
  requestCount: number;
  error?: string;
}

export async function checkSpeed(url: string): Promise<SpeedResult> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    // For counting requests and total size
    let requestCount = 0;
    let totalBytes = 0;

    // Intercept responses to calculate size and count
    page.on("response", async (response) => {
      requestCount++;
      try {
        const buffer = await response.buffer().catch(() => null);
        if (buffer) {
          totalBytes += buffer.length;
        } else {
          // If we couldn't get the buffer (e.g., redirect), try content-length
          const contentLength = response.headers()["content-length"];
          if (contentLength) {
            totalBytes += parseInt(contentLength, 10);
          }
        }
      } catch (e) {
        // Ignore errors when fetching the response body
      }
    });

    // Save time of navigation start
    const startTime = Date.now();

    // Navigate to the page and wait for full loading
    const response = await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const loadTime = Date.now() - startTime;

    // Get performance timings through the Performance API
    const performanceTiming = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        return {
          ttfb: navigation.responseStart, // TTFB
          domContentLoaded: navigation.domContentLoadedEventEnd,
        };
      }
      return null;
    });

    await browser.close();

    return {
      loadTime,
      ttfb: performanceTiming?.ttfb || 0,
      domContentLoaded: performanceTiming?.domContentLoaded || 0,
      pageSize: totalBytes,
      requestCount,
    };
  } catch (error) {
    // Закрываем браузер в случае ошибки
    if (browser) {
      await browser.close();
    }

    return {
      loadTime: 0,
      ttfb: 0,
      domContentLoaded: 0,
      pageSize: 0,
      requestCount: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
