interface Stats {
  total: number;
  operational: number;
  degraded: number;
  down: number;
  overallUptime: number;
}

export const useStats = () => {
  const { data, pending, error } = useAsyncData<Stats>(
    "stats",
    () => $fetch<Stats>("/api/stats"),
    {
      default: () => ({
        total: 0,
        operational: 0,
        degraded: 0,
        down: 0,
        overallUptime: 100,
      }),
      server: true, // обязательно для SSR
    },
  );

  return {
    stats: data,
    loading: pending,
    error,
  };
};
