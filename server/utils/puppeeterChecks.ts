import { chromium, type Page, type Response } from 'playwright';
import { Buffer } from 'node:buffer';

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
  // Запуск с вашими флагами оптимизации
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const context = await browser.newContext({
      viewport: {
        width: options.viewportWidth || 1280,
        height: options.viewportHeight || 800,
      },
    });

    const page = await context.newPage();

    let requestCount = 0;
    let totalPageSize = 0;

    // Логика подсчета запросов
    page.on('request', () => {
      requestCount++;
    });

    // Логика подсчета размера страницы (аналог вашего buffer.length)
    page.on('response', async (response: Response) => {
      try {
        const body = await response.body();
        totalPageSize += body.length;
      } catch (e) {
        // Игнорируем ошибки (например, для редиректов или заблокированных запросов)
      }
    });

    const navigationStart = Date.now();

    // Переход (networkidle в Playwright заменяет networkidle2)
    await page.goto(url, {
      waitUntil: 'load',
      timeout: options.timeout || 30000,
    });

    const loadTime = Date.now() - navigationStart;

    // Метрики через Performance API
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

    // Скриншот
    const screenshotBuffer = await page.screenshot({
      fullPage: options.fullPage || false,
      type: 'png',
    });

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
    // Гарантированно закрываем браузер
    await browser.close();
  }
}
