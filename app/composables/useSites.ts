import type { SiteInterface } from "~~/types";

export const useSites = () => {
  const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

  const {
    data: sites,
    pending: loading,
    error: fetchError,
    refresh,
  } = useAsyncData<SiteInterface[]>(
    "sites",
    async () => {
      try {
        return await $fetch<SiteInterface[]>("/api/status", {
          headers,
          credentials: "include",
        });
      } catch (e: any) {
        if (e?.status === 401) {
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

  const error = computed(() => fetchError.value?.message || null);

  const fetchSites = async () => {
    await refresh();
  };

  const addSite = async (siteData: Partial<SiteInterface>) => {
    try {
      const data = await $fetch("/api/sites", {
        method: "POST",
        body: siteData,
        credentials: "include",
      });
      if (data) {
        await refresh();
        return data;
      }
    } catch (e: any) {
      throw new Error(e?.data?.message || "Failed to add site");
    }
  };

  const updateSite = async (id: number, siteData: Partial<SiteInterface>) => {
    try {
      const data = await $fetch(`/api/sites/${id}`, {
        method: "PATCH",
        body: siteData,
        credentials: "include",
      });
      if (data) {
        await refresh();
        return data;
      }
    } catch (e: any) {
      throw new Error(e?.data?.message || "Failed to update site");
    }
  };

  const deleteSite = async (id: number) => {
    try {
      await $fetch(`/api/sites/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      // Since sites is reactive from useAsyncData, refresh to update
      await refresh();
    } catch (e: any) {
      throw new Error(e?.data?.message || "Failed to delete site");
    }
  };

  return {
    sites,
    loading,
    error,
    refresh,
    fetchSites,
    addSite,
    updateSite,
    deleteSite,
  };
};
