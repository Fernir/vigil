import type { Ref } from "vue";
import { useMonitoring } from "./useMonitoring";

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
  checkedAt: string;
}

export interface SpeedResult {
  id: number;
  siteId: number;
  loadTime: number;
  ttfb: number;
  domContentLoaded: number;
  pageSize: number;
  requestCount: number;
  error: string | null;
  checkedAt: string;
}

export const useSiteMetrics = (siteId: MaybeRef<number>) => {
  const idRef = toRef(siteId);
  const { results, fetchSiteHistory } = useMonitoring();

  // Загружаем историю проверок при изменении siteId
  watchEffect(() => {
    const id = idRef.value;
    if (id) {
      fetchSiteHistory(id, 30);
    }
  });

  const sslUrl = computed(() => `/api/sites/${idRef.value}/ssl`);
  const speedUrl = computed(() => `/api/sites/${idRef.value}/speed`);

  const {
    data: sslResults,
    refresh: refreshSSL,
    pending: sslLoading,
    error: sslError,
  } = useFetch<SSLResult[]>(sslUrl, {
    lazy: true,
    server: false,
  });

  const {
    data: speedResults,
    refresh: refreshSpeed,
    pending: speedLoading,
    error: speedError,
  } = useFetch<SpeedResult[]>(speedUrl, {
    lazy: true,
    server: false,
  });

  const lastSSL = computed(() => sslResults.value?.[0] || null);
  const lastSpeed = computed(() => speedResults.value?.[0] || null);
  const loading = computed(() => sslLoading.value || speedLoading.value);

  const uptimePercentage = computed(() => {
    const data = results.value[idRef.value] || [];
    if (!data.length) return 0;
    const up = data.filter((r) => r.status === "up").length;
    return Number(((up / data.length) * 100).toFixed());
  });

  const avgResponseTime = computed(() => {
    const data = results.value[idRef.value] || [];
    if (!data.length) return 0;
    const sum = data.reduce((acc, r) => acc + r.responseTime, 0);
    return Math.round(sum / data.length);
  });

  return {
    sslResults,
    speedResults,
    lastSSL,
    lastSpeed,
    refreshSSL,
    refreshSpeed,
    loading,
    sslError,
    speedError,
    uptimePercentage,
    avgResponseTime,
  };
};
