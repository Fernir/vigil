<script setup lang="ts">
import { Plus, Server } from "lucide-vue-next";

definePageMeta({});

useHead({ title: "Status" });

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
        <h1 class="mb-4 text-3xl font-bold text-foreground">Services average status</h1>

        <!-- Statistics -->
        <div v-if="statsLoading" class="stacked mb-6 gap-4">
          <div v-for="i in 4" :key="i" class="card animate-pulse p-4">
            <div class="mb-2 h-4 w-1/2 rounded bg-muted"></div>
            <div class="h-6 w-1/3 rounded bg-muted"></div>
          </div>
        </div>
        <div v-else class="stacked mb-6 gap-4">
          <div class="overall">
            <div class="text-sm text-muted-foreground">Overall uptime</div>
            <div class="text-2xl font-bold tabular-nums text-success-600 dark:text-success-400">
              {{ stats?.overallUptime ?? 100 }}%
            </div>
          </div>
          <div class="overall">
            <div class="text-sm text-muted-foreground">Operational</div>
            <div class="text-2xl font-bold tabular-nums text-success-600 dark:text-success-400">
              {{ stats?.operational ?? 0 }}
            </div>
          </div>
          <div class="overall">
            <div class="text-sm text-muted-foreground">Degraded</div>
            <div class="text-2xl font-bold tabular-nums text-warning-600 dark:text-warning-400">
              {{ stats?.degraded ?? 0 }}
            </div>
          </div>
          <div class="overall">
            <div class="text-sm text-muted-foreground">Downtime</div>
            <div class="text-2xl font-bold tabular-nums text-error-600 dark:text-error-400">
              {{ stats?.down ?? 0 }}
            </div>
          </div>
        </div>

        <SSEIndicator />
      </div>

      <!-- Block with site list – only for authorized users -->
      <div
        v-if="loggedIn && !!user?.banned_at"
        class="card mt-8 border-dashed p-6 text-center text-muted-foreground"
      >
        You are banned at {{ formatDateTime(user?.banned_at.toString()) }}.
      </div>
      <div v-if="loggedIn && !user?.banned_at" class="mt-8">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="mb-4 text-2xl font-bold text-foreground">All services</h2>
          <Button variant="default" as-child>
            <NuxtLink to="/sites/add" class="inline-flex items-center gap-2">
              <Plus class="size-4" />
              Add Site
            </NuxtLink>
          </Button>
        </div>

        <div v-if="isHydrated && sitesLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="card p-6">
            <div class="animate-pulse">
              <div class="mb-4 h-4 w-1/4 rounded bg-muted"></div>
              <div class="h-3 w-1/3 rounded bg-muted"></div>
            </div>
          </div>
        </div>

        <div v-else-if="sites.length" class="space-y-4">
          <SiteCard v-for="site in sites" :key="site.id" :site="site" @delete="handleDelete" />
        </div>

        <div v-else class="text-center py-12 card">
          <Server class="mx-auto mb-4 size-12 text-muted-foreground opacity-70" />
          <h3 class="mb-2 text-lg font-medium text-foreground">No sites yet</h3>
          <p class="text-muted-foreground">
            <NuxtLink
              to="/sites/add"
              class="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-muted-foreground"
            >
              Add your first site
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
