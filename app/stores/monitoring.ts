import { defineStore } from 'pinia';
import type { CheckResultInterface, SpeedResultInterface, SSLResultInterface, ScreenshotResultInterface } from '~~/types';

export const useMonitoringStore = defineStore('monitoring', () => {
  const results = ref<Record<number, CheckResultInterface[]>>({});
  const latestResults = ref<Record<number, CheckResultInterface>>({});
  const speedResults = ref<Record<number, SpeedResultInterface[]>>({});
  const latestSpeedResults = ref<Record<number, SpeedResultInterface>>({});
  const sslResults = ref<Record<number, SSLResultInterface[]>>({});
  const latestSSLResults = ref<Record<number, SSLResultInterface>>({});
  const screenshotResults = ref<Record<number, ScreenshotResultInterface>>({});
  const anomalyResults = ref<Record<number, any[]>>({});

  // SSE Management
  const sseConnected = ref(false);
  const eventSource = ref<EventSource | null>(null);
  const retryCount = ref(0);
  const maxRetries = 10;
  const subscriberCount = ref(0);

  // --- PRIVATE LOGIC ---
  const handleIncomingData = (data: any) => {
    const { siteId, type } = data;
    if (!siteId) return;

    if (type === 'http') {
      const current = results.value[siteId] || [];
      results.value[siteId] = [data, ...current].slice(0, 100);
      latestResults.value[siteId] = data;
    } else if (type === 'speed') {
      const current = speedResults.value[siteId] || [];
      speedResults.value[siteId] = [data, ...current].slice(0, 50);
      latestSpeedResults.value[siteId] = data;
    } else if (type === 'ssl') {
      const current = sslResults.value[siteId] || [];
      sslResults.value[siteId] = [data, ...current].slice(0, 50);
      latestSSLResults.value[siteId] = data;
    } else if (type === 'screenshot') {
      screenshotResults.value[siteId] = data;
    } else if (type === 'anomaly') {
      const current = anomalyResults.value[siteId] || [];
      anomalyResults.value[siteId] = [data, ...current].slice(0, 20);
    }
  };

  // --- ACTIONS ---
  const connectToSSE = () => {
    if (import.meta.server || eventSource.value) return;

    const source = new EventSource('/api/sse');

    source.onopen = () => {
      sseConnected.value = true;
      retryCount.value = 0;
      console.log('[SSE] Connected');
    };

    source.addEventListener('check-result', (event) => {
      try {
        handleIncomingData(JSON.parse(event.data));
      } catch (e) {
        console.error('[SSE] Parse error', e);
      }
    });

    source.onerror = () => {
      sseConnected.value = false;
      source.close();
      eventSource.value = null;

      if (retryCount.value < maxRetries) {
        retryCount.value++;
        const delay = Math.min(1000 * Math.pow(2, retryCount.value), 30000);
        console.log(`[SSE] Reconnecting in ${delay}ms...`);
        setTimeout(connectToSSE, delay);
      }
    };

    eventSource.value = source;
  };

  const disconnectSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      sseConnected.value = false;
    }
  };

  const fetchSSLHistory = async (siteId: number) => {
    if (!siteId) return;
    try {
      const data = await $fetch<SSLResultInterface[]>(`/api/sites/${siteId}/ssl`);
      if (data) {
        sslResults.value[siteId] = data;
        if (data[0]) {
          latestSSLResults.value[siteId] = data[0];
        }
      }
    } catch (e) {
      console.error(`[Store] Failed to fetch SSL history for site ${siteId}`, e);
    }
  };

  const fetchAnomalies = async (siteId: number) => {
    if (!siteId) return;
    try {
      // Предположим, у тебя есть такой эндпоинт
      const data = await $fetch<any[]>(`/api/sites/${siteId}/anomalies`);
      if (data) {
        anomalyResults.value[siteId] = data;
      }
    } catch (e) {
      console.error(`[Store] Failed to fetch anomalies for site ${siteId}`, e);
    }
  };

  // Fetching methods (SSR friendly)
  const fetchSiteHistory = async (siteId: number, days = 1) => {
    try {
      const data = await $fetch<CheckResultInterface[]>(`/api/sites/${siteId}/stats`, { params: { days } });
      if (data) {
        results.value[siteId] = data;
        if (data[0]) latestResults.value[siteId] = data[0];
      }
    } catch (e) {
      console.error('History fetch error', e);
    }
  };

  const fetchSpeedHistory = async (siteId: number) => {
    try {
      const data = await $fetch<SpeedResultInterface[]>(`/api/sites/${siteId}/speed`);
      if (data) {
        speedResults.value[siteId] = data;
        if (data[0]) latestSpeedResults.value[siteId] = data[0];
      }
    } catch (e) {
      console.error('Speed fetch error', e);
    }
  };

  // Helpers for components
  const registerConsumer = () => {
    subscriberCount.value++;
    if (subscriberCount.value === 1) connectToSSE();
  };

  const unregisterConsumer = () => {
    subscriberCount.value = Math.max(0, subscriberCount.value - 1);
    if (subscriberCount.value === 0) disconnectSSE();
  };

  const getLatestResult = (siteId: number) => latestResults.value[siteId] || null;
  const getLatestSpeed = (siteId: number) => latestSpeedResults.value[siteId] || null;
  const getLatestSSL = (siteId: number) => latestSSLResults.value[siteId] || null;
  const getLatestScreenshot = (siteId: number) => screenshotResults.value[siteId] || null;
  const getAnomalies = (siteId: number) => anomalyResults.value[siteId] || [];
  const getHistory = (siteId: number) => results.value[siteId] || [];

  return {
    results,
    latestResults,
    speedResults,
    latestSpeedResults,
    sslResults,
    latestSSLResults,
    screenshotResults,
    anomalyResults,
    sseConnected,
    fetchSiteHistory,
    fetchSpeedHistory,
    fetchAnomalies,
    fetchSSLHistory,
    registerConsumer,
    unregisterConsumer,
    connectToSSE,
    getLatestResult,
    getLatestSpeed,
    getLatestSSL,
    getLatestScreenshot,
    getAnomalies,
    getHistory,
  };
});
