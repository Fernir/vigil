import type { CheckResult } from "../../server/utils/db";

export const useMonitoring = () => {
  const results = ref<Record<number, CheckResult[]>>({});
  const latestResults = ref<Record<number, CheckResult>>({});
  const sseConnected = ref(false);
  const eventSource = ref<EventSource | null>(null);

  const connectToSSE = () => {
    if (process.client && !eventSource.value) {
      try {
        const source = new EventSource("/api/sse");

        source.onopen = () => {
          sseConnected.value = true;
        };

        source.addEventListener("check-result", (event: MessageEvent) => {
          try {
            const result: CheckResult = JSON.parse(event.data);

            if (result?.siteId) {
              const siteId = result.siteId;

              // Обновляем результаты
              const currentResults = results.value[siteId] || [];
              results.value = {
                ...results.value,
                [siteId]: [result, ...currentResults].slice(0, 100),
              };

              // Обновляем последний результат
              latestResults.value = {
                ...latestResults.value,
                [siteId]: result,
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

  const fetchSiteHistory = async (siteId: number, days = 10) => {
    if (!siteId) return;

    try {
      const data = await $fetch<CheckResult[]>(
        `/api/sites/${siteId}/stats?days=${days}`,
      );

      if (data) {
        results.value = {
          ...results.value,
          [siteId]: data,
        };

        if (data[0]) {
          latestResults.value = {
            ...latestResults.value,
            [siteId]: data[0],
          };
        }
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  onUnmounted(() => {
    disconnectSSE();
  });

  return {
    results,
    latestResults,
    sseConnected,
    connectToSSE,
    disconnectSSE,
    fetchSiteHistory,
  };
};
