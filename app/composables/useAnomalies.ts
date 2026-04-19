import type { AnomalyResult } from '~~/types';
import { FetchError } from 'ofetch';
import { useMonitoring } from './useMonitoring';

export const useAnomalies = (siteId: number) => {
  const headers = process.server ? useRequestHeaders(['cookie']) : undefined;

  const anomalies = ref<AnomalyResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const { anomalyResults } = useMonitoring();

  const fetchAnomalies = async (siteId: number) => {
    if (!siteId) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<AnomalyResult>(`/api/sites/${siteId}/anomalies`, {
        headers,
        credentials: 'include',
      });
      anomalies.value = data;
    } catch (e: unknown) {
      error.value = e instanceof FetchError ? e.message : 'Failed to fetch anomalies';
      console.error('Anomaly fetch error:', e);
    } finally {
      loading.value = false;
    }
  };

  const realtimeAnomalies = computed(() => anomalyResults.value[siteId] || []);

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
