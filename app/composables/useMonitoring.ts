import type {
  CheckResultInterface,
  SpeedResultInterface,
  SSLResultInterface,
  ScreenshotResultInterface,
} from "~~/types";

// HTTP results
const results = ref<Record<number, CheckResultInterface[]>>({});
const latestResults = ref<Record<number, CheckResultInterface>>({});

// Speed results
const speedResults = ref<Record<number, SpeedResultInterface[]>>({});
const latestSpeedResults = ref<Record<number, SpeedResultInterface>>({});

// SSL results
const sslResults = ref<Record<number, SSLResultInterface[]>>({});
const latestSSLResults = ref<Record<number, SSLResultInterface>>({});

// Screenshot results
const screenshotResults = ref<Record<number, ScreenshotResultInterface>>({});

const sseConnected = ref(false);
const eventSource = ref<EventSource | null>(null);

export const useMonitoring = () => {
  const connectToSSE = () => {
    if (process.client && !eventSource.value) {
      try {
        const source = new EventSource("/api/sse");

        source.onopen = () => {
          console.log("SSE connected");
          sseConnected.value = true;
        };

        source.addEventListener("check-result", (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            // console.log("SSE received:", data);

            if (data.type === "http" && data.siteId) {
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
            } else if (data.type === "speed" && data.siteId) {
              const siteId = data.siteId;
              const currentResults = speedResults.value[siteId] || [];
              speedResults.value = {
                ...speedResults.value,
                [siteId]: [data, ...currentResults].slice(0, 50),
              };
              latestSpeedResults.value = {
                ...latestSpeedResults.value,
                [siteId]: data,
              };
            } else if (data.type === "ssl" && data.siteId) {
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
              const siteId = data.siteId;
              screenshotResults.value = {
                ...screenshotResults.value,
                [siteId]: data,
              };
            }
          } catch (e) {
            console.error("Failed to parse SSE data", e);
          }
        });

        source.onerror = () => {
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

  // HTTP history
  const fetchSiteHistory = async (siteId: number, days = 10) => {
    if (!siteId) return;
    try {
      const data = await $fetch<CheckResultInterface[]>(
        `/api/sites/${siteId}/stats?days=${days}`,
      );
      if (data) {
        results.value = { ...results.value, [siteId]: data };
        if (data[0]) {
          latestResults.value = { ...latestResults.value, [siteId]: data[0] };
        }
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  // Speed history
  const fetchSpeedHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SpeedResultInterface[]>(
        `/api/sites/${siteId}/speed`,
      );
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

  // SSL history
  const fetchSSLHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SSLResultInterface[]>(
        `/api/sites/${siteId}/ssl`,
      );
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

  // Screenshot
  const fetchScreenshotData = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<ScreenshotResultInterface>(
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

  // Getters
  const getLatestResult = (siteId: number) =>
    latestResults.value[siteId] || null;
  const getLatestSpeed = (siteId: number) =>
    latestSpeedResults.value[siteId] || null;
  const getLatestSSL = (siteId: number) =>
    latestSSLResults.value[siteId] || null;
  const getLatestScreenshot = (siteId: number) =>
    screenshotResults.value[siteId] || null;

  onUnmounted(() => {
    disconnectSSE();
  });

  return {
    // HTTP
    results,
    latestResults,
    fetchSiteHistory,
    getLatestResult,

    // Speed
    speedResults,
    latestSpeedResults,
    fetchSpeedHistory,
    getLatestSpeed,

    // SSL
    sslResults,
    latestSSLResults,
    fetchSSLHistory,
    getLatestSSL,

    // Screenshot
    screenshotResults,
    fetchScreenshotData,
    getLatestScreenshot,

    // SSE
    sseConnected,
    connectToSSE,
    disconnectSSE,
  };
};
