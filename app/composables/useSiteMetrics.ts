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
  checked_at: string;
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
  checked_at: string;
}

export interface ScreenshotResult {
  id: number;
  siteId: number;
  filename: string;
  width: number;
  height: number;
  checked_at: string;
}

export const useSiteMetrics = (siteId: MaybeRef<number>) => {
  const idRef = toRef(siteId);

  // Get access to check history and its loading function
  const { results, fetchSiteHistory } = useMonitoring();

  // Load history when siteId changes
  watchEffect(() => {
    const id = idRef.value;
    if (id) {
      fetchSiteHistory(id, 30); // last 30 days
    }
  });

  const sslUrl = computed(() => `/api/sites/${idRef.value}/ssl`);
  const speedUrl = computed(() => `/api/sites/${idRef.value}/speed`);
  const screenshotUrl = computed(() => `/api/sites/${idRef.value}/screenshot`);

  const {
    data: sslResults,
    refresh: refreshSSL,
    pending: sslLoading,
    error: sslError,
  } = useFetch<SSLResult[]>(sslUrl, { lazy: true, server: false });

  const {
    data: speedResults,
    refresh: refreshSpeed,
    pending: speedLoading,
    error: speedError,
  } = useFetch<SpeedResult[]>(speedUrl, { lazy: true, server: false });

  const { data: screenshotData, refresh: refreshScreenshot } =
    useFetch<ScreenshotResult>(screenshotUrl, {
      lazy: true,
      server: false,
    });

  const lastSSL = computed(() => sslResults.value?.[0] || null);
  const lastSpeed = computed(() => speedResults.value?.[0] || null);
  const lastScreenshot = computed(() => screenshotData.value || null);

  const loading = computed(() => sslLoading.value || speedLoading.value);

  // Metrics based on check history
  const uptimePercentage = computed(() => {
    const data = results.value[idRef.value] || [];
    if (!data.length) return 0;
    const up = data.filter((r) => r.status === "up").length;
    return ((up / data.length) * 100).toFixed();
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
    lastScreenshot,
    refreshSSL,
    refreshSpeed,
    refreshScreenshot,
    loading,
    sslError,
    speedError,
    uptimePercentage,
    avgResponseTime,
  };
};
