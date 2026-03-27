import { useMonitoring } from './useMonitoring';

export const useSiteMetrics = (siteId: MaybeRef<number>) => {
  const idRef = toRef(siteId);

  const { results } = useMonitoring();

  const uptimePercentage = computed(() => {
    const data = results.value[idRef.value] || [];
    if (!data.length) return '0';
    const up = data.filter((r) => r.status === 'up').length;
    return ((up / data.length) * 100).toFixed(2);
  });

  const avgResponseTime = computed(() => {
    const data = results.value[idRef.value] || [];
    if (!data.length) return 0;
    const sum = data.reduce((acc, r) => acc + r.responseTime, 0);
    return Math.round(sum / data.length);
  });

  return {
    uptimePercentage,
    avgResponseTime,
  };
};
