import { ref, onMounted, onUnmounted } from 'vue';
import type { CheckResultInterface, SpeedResultInterface, SSLResultInterface, ScreenshotResultInterface } from '~~/types';

const sseConnected = ref(false);
const eventSource = ref<EventSource | null>(null);
const retryCount = ref(0);
const maxRetries = 5;
const subscriberCount = ref(0);

export const useMonitoring = () => {
  // HTTP results
  const results = useState<Record<number, CheckResultInterface[]>>('monitoring-results', () => ({}));
  const latestResults = useState<Record<number, CheckResultInterface>>('monitoring-latest-results', () => ({}));

  // Speed results
  const speedResults = useState<Record<number, SpeedResultInterface[]>>('monitoring-speed-results', () => ({}));
  const latestSpeedResults = useState<Record<number, SpeedResultInterface>>('monitoring-latest-speed-results', () => ({}));

  // SSL results
  const sslResults = useState<Record<number, SSLResultInterface[]>>('monitoring-ssl-results', () => ({}));
  const latestSSLResults = useState<Record<number, SSLResultInterface>>('monitoring-latest-ssl-results', () => ({}));

  // Screenshot results
  const screenshotResults = useState<Record<number, ScreenshotResultInterface>>('monitoring-screenshot-results', () => ({}));

  // Anomaly results
  const anomalyResults = useState<Record<number, any[]>>('monitoring-anomaly-results', () => []);

  const connectToSSE = () => {
    if (process.client && !eventSource.value) {
      try {
        const source = new EventSource('/api/sse');
        sseConnected.value = false;

        source.onopen = () => {
          console.log('SSE connected');
          sseConnected.value = true;
          retryCount.value = 0; // Reset on successful connection
        };

        source.addEventListener('check-result', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            // console.log("SSE received:", data);

            if (data.type === 'http' && data.siteId) {
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
            } else if (data.type === 'speed' && data.siteId) {
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
            } else if (data.type === 'ssl' && data.siteId) {
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
            } else if (data.type === 'screenshot' && data.siteId) {
              const siteId = data.siteId;
              screenshotResults.value = {
                ...screenshotResults.value,
                [siteId]: data,
              };
            } else if (data.type === 'anomaly' && data.siteId) {
              const siteId = data.siteId;
              const currentAnomalies = anomalyResults.value[siteId] || [];
              anomalyResults.value = {
                ...anomalyResults.value,
                [siteId]: [data, ...currentAnomalies].slice(0, 20),
              };
            }
          } catch (e) {
            console.error('Failed to parse SSE data', e);
          }
        });

        source.onerror = () => {
          sseConnected.value = false;
          eventSource.value = null;
          if (retryCount.value < maxRetries) {
            retryCount.value++;
            const delay = Math.min(1000 * Math.pow(2, retryCount.value), 30000); // Exponential backoff, max 30s
            setTimeout(connectToSSE, delay);
          } else {
            console.error('SSE max retries reached, giving up');
          }
        };

        eventSource.value = source;
      } catch (e) {
        console.error('Failed to connect to SSE', e);
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
      const data = await $fetch<CheckResultInterface[]>(`/api/sites/${siteId}/stats?days=${days}`);
      if (data) {
        results.value = { ...results.value, [siteId]: data };
        if (data[0]) {
          latestResults.value = { ...latestResults.value, [siteId]: data[0] };
        }
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  // Speed history
  const fetchSpeedHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SpeedResultInterface[]>(`/api/sites/${siteId}/speed`);
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
      console.error('Failed to fetch speed history', e);
    }
  };

  // SSL history
  const fetchSSLHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SSLResultInterface[]>(`/api/sites/${siteId}/ssl`);
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
      console.error('Failed to fetch SSL history', e);
    }
  };

  // Screenshot
  const fetchScreenshotData = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<ScreenshotResultInterface>(`/api/sites/${siteId}/screenshot`);
      if (data) {
        screenshotResults.value = {
          ...screenshotResults.value,
          [siteId]: data,
        };
      }
    } catch (e) {
      console.error('Failed to fetch screenshot', e);
    }
  };

  // Getters
  const getLatestResult = (siteId: number) => latestResults.value[siteId] || null;
  const getLatestSpeed = (siteId: number) => latestSpeedResults.value[siteId] || null;
  const getLatestSSL = (siteId: number) => latestSSLResults.value[siteId] || null;
  const getLatestScreenshot = (siteId: number) => screenshotResults.value[siteId] || null;

  const registerSSEConsumer = () => {
    subscriberCount.value += 1;
    if (subscriberCount.value === 1) {
      connectToSSE();
    }
  };

  const unregisterSSEConsumer = () => {
    subscriberCount.value = Math.max(0, subscriberCount.value - 1);
    if (subscriberCount.value === 0) {
      disconnectSSE();
    }
  };

  onMounted(() => {
    if (process.client) {
      registerSSEConsumer();
    }
  });

  onUnmounted(() => {
    if (process.client) {
      unregisterSSEConsumer();
    }
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

    // Anomalies
    anomalyResults,

    // SSE
    sseConnected,
    connectToSSE,
    disconnectSSE,
  };
};
