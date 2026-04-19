import { type Page, type Response } from 'playwright';
import { Buffer } from 'node:buffer';
import { useBrowser } from '../plugins/browser';

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
  const { context, release } = await useBrowser();
  let page: Page | null = null;

  try {
    page = await context.newPage();

    if (options.viewportWidth && options.viewportHeight) {
      await page.setViewportSize({
        width: options.viewportWidth,
        height: options.viewportHeight,
      });
    }

    let requestCount = 0;
    let totalPageSize = 0;

    const onRequest = () => {
      requestCount++;
    };

    const onResponse = (response: Response) => {
      try {
        const raw = response.headers()["content-length"];
        if (raw) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) totalPageSize += n;
        }
      } catch {}
    };

    page.on("request", onRequest);
    page.on("response", onResponse);

    const navigationStart = Date.now();

    await page.goto(url, {
      waitUntil: 'load',
      timeout: options.timeout || 30000,
    });

    const loadTime = Date.now() - navigationStart;

    const metrics = await page
      .evaluate(() => {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          ttfb: navEntry ? navEntry.responseStart : 0,
          domContentLoaded: navEntry ? navEntry.domContentLoadedEventEnd : 0,
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        };
      })
      .catch(() => ({ ttfb: 0, domContentLoaded: 0, width: 0, height: 0 }));

    const screenshotBuffer = await page.screenshot({
      fullPage: options.fullPage || false,
      type: 'png',
    });

    page.off("request", onRequest);
    page.off("response", onResponse);

    return {
      loadTime,
      ttfb: metrics.ttfb,
      domContentLoaded: metrics.domContentLoaded,
      pageSize: Math.round(totalPageSize / 1024),
      requestCount,
      screenshotBuffer,
      width: options.fullPage ? metrics.width : options.viewportWidth || 1280,
      height: options.fullPage ? metrics.height : options.viewportHeight || 800,
    };
  } catch (error: any) {
    console.error(`Unified check failed for ${url}:`, error.message);
    return {
      loadTime: 0,
      ttfb: 0,
      domContentLoaded: 0,
      pageSize: 0,
      requestCount: 0,
      screenshotBuffer: Buffer.from(''),
      width: 0,
      height: 0,
      error: error.message,
    };
  } finally {
    if (page) {
      await page.close().catch(console.error);
    }

    release();
  }
}
