import { chromium, type Browser, type BrowserContext } from 'playwright';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let usageCount = 0;
let cleanupTimer: NodeJS.Timeout | null = null;

export default defineNitroPlugin(async () => {
  // Запускаем браузер при старте приложения
  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  });

  // Создаем один контекст для всех запросов
  context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  console.log('Browser launched and ready');

  // Закрываем при завершении
  process.on('beforeExit', async () => {
    await closeBrowser();
  });

  process.on('SIGINT', async () => {
    await closeBrowser();
    process.exit();
  });

  process.on('SIGTERM', async () => {
    await closeBrowser();
    process.exit();
  });
});

const closeBrowser = async () => {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  if (context) {
    await context.close().catch(console.error);
    context = null;
  }

  if (browser) {
    await browser.close().catch(console.error);
    browser = null;
  }

  console.log('Browser closed');
};

const scheduleCleanup = () => {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  // Закрываем браузер через 5 минут без использования
  cleanupTimer = setTimeout(
    async () => {
      if (usageCount === 0 && browser) {
        await closeBrowser();
      }
    },
    5 * 60 * 1000,
  );
};

export const getBrowser = () => {
  if (!browser) {
    throw new Error('Browser not initialized');
  }
  return browser;
};

export const getContext = () => {
  if (!context) {
    throw new Error('Browser context not initialized');
  }
  return context;
};

export const useBrowser = async () => {
  usageCount++;
  scheduleCleanup();

  return {
    browser: getBrowser(),
    context: getContext(),
    release: () => {
      usageCount = Math.max(0, usageCount - 1);
      scheduleCleanup();
    },
  };
};
