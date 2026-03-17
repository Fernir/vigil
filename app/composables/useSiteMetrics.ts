import type { Ref } from "vue";

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

/**
 * Композабл для загрузки SSL и Speed метрик по ID сайта
 * @param siteId – число или ref с числом (id сайта)
 */
export const useSiteMetrics = (siteId: MaybeRef<number>) => {
  const idRef = toRef(siteId);

  // URL для запросов (реактивные)
  const sslUrl = computed(() => `/api/sites/${idRef.value}/ssl`);
  const speedUrl = computed(() => `/api/sites/${idRef.value}/speed`);

  // Запрос SSL истории
  const {
    data: sslResults,
    refresh: refreshSSL,
    pending: sslLoading,
    error: sslError,
  } = useFetch<SSLResult[]>(sslUrl, {
    lazy: true, // загружаются при монтировании компонента
    server: false, // отключаем SSR для этих данных (не критичны для SEO)
  });

  // Запрос Speed истории
  const {
    data: speedResults,
    refresh: refreshSpeed,
    pending: speedLoading,
    error: speedError,
  } = useFetch<SpeedResult[]>(speedUrl, {
    lazy: true,
    server: false,
  });

  // Последние результаты (удобно для отображения в UI)
  const lastSSL = computed(() => sslResults.value?.[0] || null);
  const lastSpeed = computed(() => speedResults.value?.[0] || null);

  // Общий статус загрузки
  const loading = computed(() => sslLoading.value || speedLoading.value);

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
  };
};
