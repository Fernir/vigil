import type { SiteInterface } from '~~/types';
import { FetchError } from 'ofetch'; // Импортируем тип ошибки

export const useSites = () => {
  const headers = process.server ? useRequestHeaders(['cookie']) : undefined;

  const {
    data: sites,
    pending: loading,
    error: fetchError,
    refresh,
  } = useAsyncData<SiteInterface[]>(
    'sites',
    async () => {
      try {
        return await $fetch<SiteInterface[]>('/api/status', {
          headers,
          credentials: 'include',
        });
      } catch (e: unknown) {
        // Проверяем, является ли ошибка объектом FetchError
        if (e instanceof FetchError && e.status === 401) {
          return [];
        }
        throw e;
      }
    },
    {
      default: () => [],
      server: true,
    },
  );

  const error = computed<string | null>(() => fetchError.value?.message || null);

  const fetchSites = async (): Promise<void> => {
    await refresh();
  };

  // Вспомогательная функция для обработки ошибок в методах
  const handleError = (e: unknown, defaultMsg: string): never => {
    if (e instanceof FetchError) {
      throw new Error(e.data?.message || e.message || defaultMsg);
    }
    throw new Error(defaultMsg);
  };

  const addSite = async (siteData: Partial<SiteInterface>) => {
    try {
      const data = await $fetch<SiteInterface>('/api/sites', {
        method: 'POST',
        body: siteData,
        credentials: 'include',
      });
      await refresh();
      return data;
    } catch (e: unknown) {
      handleError(e, 'Failed to add site');
    }
  };

  const updateSite = async (id: number, siteData: Partial<SiteInterface>) => {
    try {
      const data = await $fetch<SiteInterface>(`/api/sites/${id}`, {
        method: 'PATCH',
        body: siteData,
        credentials: 'include',
      });
      await refresh();
      return data;
    } catch (e: unknown) {
      handleError(e, 'Failed to update site');
    }
  };

  const deleteSite = async (id: number): Promise<void> => {
    try {
      await $fetch(`/api/sites/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await refresh();
    } catch (e: unknown) {
      handleError(e, 'Failed to delete site');
    }
  };

  return {
    sites: sites as Ref<SiteInterface[]>,
    error,
    loading: loading as Ref<boolean>,
    refresh,
    fetchSites,
    addSite,
    updateSite,
    deleteSite,
  };
};
