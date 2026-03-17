import puppeteer, { Browser, Page } from "puppeteer";

export interface SpeedResult {
  loadTime: number;
  ttfb: number;
  domContentLoaded: number;
  pageSize: number; // в байтах
  requestCount: number;
  error?: string;
}

export async function checkSpeed(url: string): Promise<SpeedResult> {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Для подсчёта запросов и общего размера
  let requestCount = 0;
  let totalBytes = 0;

  // Перехватываем ответы, чтобы считать размер и количество
  page.on("response", async (response) => {
    requestCount++;
    try {
      const buffer = await response.buffer().catch(() => null);
      if (buffer) {
        totalBytes += buffer.length;
      } else {
        // Если не удалось получить буфер (например, redirect), пробуем content-length
        const contentLength = response.headers()["content-length"];
        if (contentLength) {
          totalBytes += parseInt(contentLength, 10);
        }
      }
    } catch (e) {
      // игнорируем ошибки получения тела
    }
  });

  // Записываем время начала навигации
  const startTime = Date.now();

  // Используем CDP, чтобы получить точные временные метки (Performance)
  const client = await page.target().createCDPSession();
  await client.send("Performance.enable");

  let ttfb = 0;
  let domContentLoaded = 0;

  // Подписываемся на события Performance, чтобы получить TTFB и DCL
  client.on("Performance.metrics", (event) => {
    // Не используется, лучше собирать после загрузки через Performance API
  });

  // Переходим на страницу и ждём полной загрузки
  const response = await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  const loadTime = Date.now() - startTime;

  // Получаем временные метки через Performance API страницы
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

  if (performanceTiming) {
    ttfb = performanceTiming.ttfb;
    domContentLoaded = performanceTiming.domContentLoaded;
  }

  await browser.close();

  return {
    loadTime,
    ttfb,
    domContentLoaded,
    pageSize: totalBytes,
    requestCount,
  };
}
