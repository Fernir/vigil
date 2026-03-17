import type { Site } from "../../server/utils/db";

export const useSites = () => {
  const sites = ref<Site[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchSites = async () => {
    if (!process.client) return;
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch<Site[]>("/api/status");
      sites.value = data || [];
    } catch (e) {
      console.error("Failed to load sites:", e);
      error.value = "Failed to load sites";
    } finally {
      loading.value = false;
    }
  };

  const addSite = async (siteData: Partial<Site>) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch("/api/sites", {
        method: "POST",
        body: siteData,
        credentials: "include",
      });
      if (data) {
        await fetchSites();
        return data;
      }
    } catch (e: any) {
      error.value = e?.data?.message || "Failed to add site";
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  const updateSite = async (id: number, siteData: Partial<Site>) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch(`/api/sites/${id}`, {
        method: "PATCH",
        body: siteData,
        credentials: "include",
      });
      if (data) {
        await fetchSites();
        return data;
      }
    } catch (e: any) {
      error.value = e?.data?.message || "Failed to update site";
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  const deleteSite = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await $fetch(`/api/sites/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      sites.value = sites.value.filter((s) => s.id !== id);
    } catch (e: any) {
      error.value = e?.data?.message || "Failed to delete site";
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  if (process.server) {
    fetchSites();
  }

  return {
    sites,
    loading,
    error,
    fetchSites,
    addSite,
    updateSite,
    deleteSite,
  };
};
