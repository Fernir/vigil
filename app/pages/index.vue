<script setup lang="ts">
definePageMeta({});

useHead({ title: 'Status' });

const { ask } = useConfirm();
const { formatDateTime } = useDate();
const { user, loggedIn } = useUserSession();
const { stats, loading: statsLoading } = useStats();
const { sites, loading: sitesLoading, refresh, deleteSite } = useSites();

const isHydrated = ref(false);
onMounted(() => {
  isHydrated.value = true;
});

watch(
  () => loggedIn.value,
  async (val) => {
    if (val) {
      await refresh();
    }
  },
  { immediate: true },
);

const handleDelete = async (id: number) => {
  const confirmed = await ask({
    title: 'Delete site?',
    description: 'Are you sure you want to delete this site? This action cannot be undone.',
  });

  if (confirmed) {
    await deleteSite(id);
  }
};
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Services average status</h1>

        <!-- Statistics -->
        <div v-if="statsLoading" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div v-for="i in 4" :key="i" class="card p-4 animate-pulse">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">Overall uptime</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats?.overallUptime ?? 100 }}%</div>
          </div>
          <div class="card p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">Operational</div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ stats?.operational ?? 0 }}
            </div>
          </div>
          <div class="card p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">Degraded</div>
            <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {{ stats?.degraded ?? 0 }}
            </div>
          </div>
          <div class="card p-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">Downtime</div>
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ stats?.down ?? 0 }}
            </div>
          </div>
        </div>

        <SSEIndicator />
      </div>

      <!-- Block with site list – only for authorized users -->
      <div v-if="loggedIn && !!user?.banned_at" class="mt-8 text-center p-6 card border-red-500 bg-red-50 dark:bg-red-900/20">
        You are banned at {{ formatDateTime(user?.banned_at.toString()) }}.
      </div>
      <div v-if="loggedIn && !user?.banned_at" class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">All services</h2>
          <UButton color="primary" to="/sites/add" icon="heroicons:plus-solid">Add Site</UButton>
        </div>

        <div v-if="isHydrated && sitesLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="card p-6">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        <div v-else-if="sites.length" class="space-y-4">
          <SiteCard v-for="site in sites" :key="site.id" :site="site" @delete="handleDelete" />
        </div>

        <div v-else class="text-center py-12 card">
          <UIcon name="heroicons:server-stack" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No sites yet</h3>
          <p class="text-gray-500 dark:text-gray-400">
            <NuxtLink to="/sites/add" class="text-primary-600 hover:underline"> Add your first site </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
