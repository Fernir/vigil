import type { AnomalyResult } from '~~/types';

export const useAnomalies = (siteId: number) => {
  const anomalies = ref<AnomalyResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const { anomalyResults } = useMonitoring();

  const fetchAnomalies = async (siteId: number) => {
    if (!siteId) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<AnomalyResult>(`/api/sites/${siteId}/anomalies`);
      anomalies.value = data;
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch anomalies';
      console.error('Anomaly fetch error:', e);
    } finally {
      loading.value = false;
    }
  };

  // Real-time anomalies from SSE
  const realtimeAnomalies = computed(() => anomalyResults.value[siteId] || []);

  // Auto-fetch on mount if siteId provided
  if (process.server) {
    if (siteId) {
      fetchAnomalies(siteId);
    }
  }

  return {
    anomalies: readonly(anomalies),
    realtimeAnomalies: readonly(realtimeAnomalies),
    loading: readonly(loading),
    error: readonly(error),
    fetchAnomalies,
  };
};
