<script setup lang="ts">
definePageMeta({});

useHead({ title: "Status" });

const { formatDateTime } = useDate();
const { user, loggedIn } = useUserSession();
const { stats, loading: statsLoading } = useStats();
const { sseConnected, connectToSSE } = useMonitoring();
const { sites, fetchSites, loading: sitesLoading, deleteSite } = useSites();

onMounted(() => {
  connectToSSE();
});

watchEffect(() => {
  if (loggedIn.value) {
    fetchSites();
  }
});

const handleDelete = async (id: number) => {
  if (confirm("Are you sure you want to delete this site?")) {
    await deleteSite(id);
    fetchSites();
  }
};
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          System Status
        </h1>

        <!-- Statistics (wrapped in ClientOnly to avoid hydration issues) -->
        <ClientOnly>
          <div
            v-if="statsLoading"
            class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div v-for="i in 4" :key="i" class="card p-4 animate-pulse">
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"
              ></div>
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="card p-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Overall Uptime
              </div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats?.overallUptime ?? 100 }}%
              </div>
            </div>
            <div class="card p-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Operational
              </div>
              <div
                class="text-2xl font-bold text-green-600 dark:text-green-400"
              >
                {{ stats?.operational ?? 0 }}
              </div>
            </div>
            <div class="card p-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Degraded
              </div>
              <div
                class="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
              >
                {{ stats?.degraded ?? 0 }}
              </div>
            </div>
            <div class="card p-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Downtime
              </div>
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ stats?.down ?? 0 }}
              </div>
            </div>
          </div>
          <template #fallback>
            <!-- Skeleton for server -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div v-for="i in 4" :key="i" class="card p-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"
                ></div>
                <div
                  class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"
                ></div>
              </div>
            </div>
          </template>
        </ClientOnly>

        <!-- Indicator for SSE (always only on client) -->
        <ClientOnly>
          <div class="flex items-center gap-2 text-sm">
            <div
              class="w-2 h-2 rounded-full"
              :class="sseConnected ? 'bg-green-500' : 'bg-red-500'"
            />
            <span class="text-gray-600 dark:text-gray-400">
              {{ sseConnected ? "Live updates connected" : "Reconnecting..." }}
            </span>
          </div>
        </ClientOnly>
      </div>

      <!-- Block with site list – only for authorized users (also ClientOnly) -->
      <ClientOnly>
        <div
          v-if="loggedIn && !!user?.banned_at"
          class="mt-8 text-center p-6 card border-red-500 bg-red-50 dark:bg-red-900/20"
        >
          You are banned at {{ formatDateTime(user?.banned_at) }}.
        </div>
        <div v-if="loggedIn && !user?.banned_at" class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              All services
            </h2>
            <UButton
              color="primary"
              to="/sites/add"
              icon="heroicons:plus-solid"
            >
              Add Site
            </UButton>
          </div>

          <div v-if="sitesLoading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="card p-6">
              <div class="animate-pulse">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"
                ></div>
                <div
                  class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"
                ></div>
              </div>
            </div>
          </div>

          <div v-else-if="sites.length" class="space-y-4">
            <SiteCard
              v-for="site in sites"
              :key="site.id"
              :site="site"
              detailed
              @delete="handleDelete"
            />
          </div>

          <div v-else class="text-center py-12 card">
            <UIcon
              name="heroicons:server-stack"
              class="w-12 h-12 mx-auto text-gray-400 mb-4"
            />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sites yet
            </h3>
            <p class="text-gray-500 dark:text-gray-400">
              <NuxtLink
                to="/sites/add"
                class="text-primary-600 hover:underline"
              >
                Add your first site
              </NuxtLink>
            </p>
          </div>
        </div>
        <template #fallback>
          <!-- For server-side rendering, we don't show the sites block at all -->
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
