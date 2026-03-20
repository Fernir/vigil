import type { CheckResult } from "~~/server/utils/db";

// Интерфейсы для разных типов результатов
export interface SpeedResult {
  id: number;
  siteId: number;
  loadTime: number;
  ttfb: number;
  domContentLoaded: number;
  pageSize: number;
  requestCount: number;
  error: string | null;
  checked_at: string;
  type?: "speed";
  siteName?: string;
  siteUrl?: string;
}

export interface SSLResult {
  id: number;
  siteId: number;
  valid: boolean;
  expired: boolean;
  daysLeft: number;
  validFrom: string;
  validTo: string;
  issuer: string | null;
  error: string | null;
  checked_at: string;
  type?: "ssl";
  siteName?: string;
  siteUrl?: string;
}

export interface ScreenshotResult {
  id: number;
  siteId: number;
  width: number;
  height: number;
  checked_at: string;
  type?: "screenshot";
  siteName?: string;
  siteUrl?: string;
  image_base64?: string; // для отображения
}

export const useMonitoring = () => {
  // Основные результаты проверок
  const results = ref<Record<number, CheckResult[]>>({});
  const latestResults = ref<Record<number, CheckResult>>({});

  // Speed результаты
  const speedResults = ref<Record<number, SpeedResult[]>>({});
  const latestSpeedResults = ref<Record<number, SpeedResult>>({});

  // SSL результаты
  const sslResults = ref<Record<number, SSLResult[]>>({});
  const latestSSLResults = ref<Record<number, SSLResult>>({});

  // Скриншоты (храним только последний)
  const screenshotResults = ref<Record<number, ScreenshotResult>>({});

  const sseConnected = ref(false);
  const eventSource = ref<EventSource | null>(null);

  const connectToSSE = () => {
    if (process.client && !eventSource.value) {
      try {
        const source = new EventSource("/api/sse");

        source.onopen = () => {
          console.log("✅ Connected to SSE");
          sseConnected.value = true;
        };

        source.addEventListener("check-result", (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            console.log("SSE received:", data);

            if (data.type === "speed" && data.siteId) {
              // Обновляем speed результаты
              const siteId = data.siteId;
              const currentResults = speedResults.value[siteId] || [];

              // Добавляем новый результат в начало
              speedResults.value = {
                ...speedResults.value,
                [siteId]: [data, ...currentResults].slice(0, 50), // храним последние 50
              };

              // Обновляем последний результат
              latestSpeedResults.value = {
                ...latestSpeedResults.value,
                [siteId]: data,
              };
            } else if (data.type === "ssl" && data.siteId) {
              // Обновляем SSL результаты
              const siteId = data.siteId;
              const currentResults = sslResults.value[siteId] || [];

              sslResults.value = {
                ...sslResults.value,
                [siteId]: [data, ...currentResults].slice(0, 50),
              };

              latestSSLResults.value = {
                ...latestSSLResults.value,
                [siteId]: data,
              };
            } else if (data.type === "screenshot" && data.siteId) {
              // Обновляем скриншот (только последний)
              const siteId = data.siteId;

              // Скриншот приходит без base64, его нужно будет загрузить отдельно
              screenshotResults.value = {
                ...screenshotResults.value,
                [siteId]: data,
              };

              // Опционально: загружаем сам скриншот
              fetchScreenshotData(siteId);
            } else if (data.siteId) {
              // Обычный check-result
              const siteId = data.siteId;
              const currentResults = results.value[siteId] || [];

              results.value = {
                ...results.value,
                [siteId]: [data, ...currentResults].slice(0, 100),
              };

              latestResults.value = {
                ...latestResults.value,
                [siteId]: data,
              };
            }
          } catch (e) {
            console.error("Failed to parse SSE data", e);
          }
        });

        source.onerror = () => {
          console.log("❌ SSE disconnected, reconnecting...");
          sseConnected.value = false;
          eventSource.value = null;
          setTimeout(connectToSSE, 5000);
        };

        eventSource.value = source;
      } catch (e) {
        console.error("Failed to connect to SSE", e);
        sseConnected.value = false;
      }
    }
  };

  const disconnectSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      sseConnected.value = false;
    }
  };

  // Функция для загрузки истории основных проверок
  const fetchSiteHistory = async (siteId: number, days = 10) => {
    if (!siteId) return;
    try {
      const data = await $fetch<CheckResult[]>(
        `/api/sites/${siteId}/stats?days=${days}`,
      );

      if (data) {
        results.value = { ...results.value, [siteId]: data };
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  // Функция для загрузки истории speed проверок
  const fetchSpeedHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SpeedResult[]>(`/api/sites/${siteId}/speed`);
      if (data) {
        speedResults.value = { ...speedResults.value, [siteId]: data };
        if (data[0]) {
          latestSpeedResults.value = {
            ...latestSpeedResults.value,
            [siteId]: data[0],
          };
        }
      }
    } catch (e) {
      console.error("Failed to fetch speed history", e);
    }
  };

  // Функция для загрузки истории SSL проверок
  const fetchSSLHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SSLResult[]>(`/api/sites/${siteId}/ssl`);
      if (data) {
        sslResults.value = { ...sslResults.value, [siteId]: data };
        if (data[0]) {
          latestSSLResults.value = {
            ...latestSSLResults.value,
            [siteId]: data[0],
          };
        }
      }
    } catch (e) {
      console.error("Failed to fetch SSL history", e);
    }
  };

  // Функция для загрузки скриншота
  const fetchScreenshotData = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<ScreenshotResult>(
        `/api/sites/${siteId}/screenshot`,
      );
      if (data) {
        screenshotResults.value = {
          ...screenshotResults.value,
          [siteId]: data,
        };
      }
    } catch (e) {
      console.error("Failed to fetch screenshot", e);
    }
  };

  // Компьютеды для удобного доступа к последним данным
  const getLatestResult = (siteId: number) =>
    latestResults.value[siteId] || null;
  const getLatestSpeed = (siteId: number) =>
    latestSpeedResults.value[siteId] || null;
  const getLatestSSL = (siteId: number) =>
    latestSSLResults.value[siteId] || null;
  const getLatestScreenshot = (siteId: number) =>
    screenshotResults.value[siteId] || null;

  // Компьютеды для истории
  const getHistory = (siteId: number) => results.value[siteId] || [];
  const getSpeedHistory = (siteId: number) => speedResults.value[siteId] || [];
  const getSSLHistory = (siteId: number) => sslResults.value[siteId] || [];

  onUnmounted(() => {
    disconnectSSE();
  });

  return {
    // Основные результаты
    results,
    latestResults,

    // Speed результаты
    speedResults,
    latestSpeedResults,

    // SSL результаты
    sslResults,
    latestSSLResults,

    // Скриншоты
    screenshotResults,

    // SSE статус
    sseConnected,

    // Методы подключения
    connectToSSE,
    disconnectSSE,

    // Методы загрузки истории
    fetchSiteHistory,
    fetchSpeedHistory,
    fetchSSLHistory,
    fetchScreenshotData,

    // Геттеры для удобства
    getLatestResult,
    getLatestSpeed,
    getLatestSSL,
    getLatestScreenshot,
    getHistory,
    getSpeedHistory,
    getSSLHistory,
  };
};
