<script setup lang="ts">
import { ArrowLeft, Loader2, Trash2, X } from 'lucide-vue-next';
import type { SiteInterface } from '~~/types';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);

useHead({ title: 'Edit Site' });

const showModal = ref(false);
const isLoading = ref(false);

const { getLatestResult, getLatestSSL, getLatestSpeed, getLatestScreenshot, fetchSpeedHistory, fetchSSLHistory, fetchSiteHistory } = useMonitoring();
const { ask } = useConfirm();

const lastSSL = computed(() => getLatestSSL(siteId));
const lastSpeed = computed(() => getLatestSpeed(siteId));
const lastScreenshot = computed(() => getLatestScreenshot(siteId));
const lastResult = computed(() => getLatestResult(siteId));

const { sites, fetchSites, updateSite, loading } = useSites();
const { formatDateTime } = useDate();

const site = computed(() => sites.value.find((s) => s.id === siteId));
const siteNotFound = ref(false);

const loadData = async () => {
  isLoading.value = true;
  await fetchSiteHistory(siteId);
  await fetchSpeedHistory(siteId);
  await fetchSSLHistory(siteId);
  isLoading.value = false;
};

onServerPrefetch(async () => {
  await fetchSites();

  if (!site.value) {
    siteNotFound.value = true;
    return navigateTo('/');
  }

  await loadData();
});

onMounted(async () => {
  if (!site.value) {
    isLoading.value = true;
    await fetchSites();
  }

  if (!site.value) {
    siteNotFound.value = true;
    return;
  }

  await loadData();

  isLoading.value = false;
});

const handleDelete = async () => {
  const confirmed = await ask({
    title: 'Delete site?',
    description: 'Are you sure you want to delete this site? This action cannot be undone.',
  });

  if (confirmed) {
    try {
      const { deleteSite } = useSites();
      await deleteSite(siteId);
      router.push('/');
    } catch (error) {
      console.error('Failed to delete site:', error);
    }
  }
};

const handleSubmit = async (form: SiteInterface) => {
  const result = await updateSite(siteId, form);

  if (result) router.push('/');
};

const screenshotUrl = computed(() => `/api/sites/${siteId}/screenshot${lastScreenshot.value?.hash ? `?hash=${lastScreenshot.value.hash}` : ''}`);

const lastCheckStatusClass = computed(() => {
  const s = lastResult.value?.status;
  if (s === 'up') return 'text-success-600 dark:text-success-400';
  if (s === 'down') return 'text-error-600 dark:text-error-400';
  if (s === 'degraded') return 'text-warning-600 dark:text-warning-400';
  return 'text-muted-foreground';
});

const sslValidClass = computed(() => (lastSSL.value?.valid ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'));
</script>

<template>
  <div class="min-h-screen bg-background py-6">
    <div class="md:max-w-7xl mx-auto md:p-6 p-2 lg:px-8 max-w-[100dvw] overflow-hidden">
      <div class="mb-4">
        <Button variant="ghost" class="gap-2" as-child>
          <NuxtLink to="/">
            <ArrowLeft class="size-4" />
            Back
          </NuxtLink>
        </Button>
      </div>

      <template v-if="siteNotFound">
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-2">Site not found</h2>
          <p class="text-sm text-muted-foreground">We could not find a site with this ID. Please go back to the dashboard.</p>
          <Button variant="default" class="mt-4" as-child>
            <NuxtLink to="/">Go to dashboard</NuxtLink>
          </Button>
        </div>
      </template>

      <div v-else class="stacked gap-6">
        <!-- Left column: editing form -->
        <div class="lg:col-span-1 space-y-6">
          <div class="card p-5">
            <h2 class="text-lg font-semibold mb-4">Settings</h2>
            <SiteForm :initial-data="site" @submit="handleSubmit" :loading="isLoading">
              <div class="flex justify-between gap-2 pt-2">
                <div class="flex gap-2">
                  <Button type="submit" variant="default" :disabled="loading">
                    <Loader2 v-if="loading" class="mr-1 size-3.5 animate-spin" />
                    Save
                  </Button>
                  <Button variant="ghost" as-child>
                    <NuxtLink to="/">Cancel</NuxtLink>
                  </Button>
                </div>

                <Button variant="destructive" class="gap-1" @click="handleDelete">
                  <Trash2 class="size-3.5" />
                  Delete
                </Button>
              </div>
            </SiteForm>
          </div>
          <div class="md:card md:p-5 px-5">
            <SSEIndicator />
          </div>
        </div>

        <!-- Right column: all metrics and charts -->
        <div class="lg:col-span-2 space-y-6 max-w-[100dvw] overflow-hidden">
          <div class="card p-5">
            <h3 class="text-md font-semibold mb-3">Last Screenshot</h3>
            <img
              :src="screenshotUrl"
              alt="Website screenshot"
              class="w-full max-h-64 object-cover border rounded-lg shadow-sm cursor-pointer"
              loading="lazy"
              decoding="async"
              @click="showModal = true"
            />

            <p class="mt-2 text-center text-xs text-muted-foreground">Click to enlarge</p>
            <!-- Modal window for enlarged view -->
            <Dialog v-model:open="showModal">
              <DialogContent class="max-h-[95vh] max-w-[95vw] border-0 bg-transparent p-0 shadow-none">
                <DialogHeader class="sr-only">
                  <DialogTitle>Screenshot preview</DialogTitle>
                </DialogHeader>
                <Button variant="secondary" size="icon" class="absolute right-4 top-4 z-50" @click="showModal = false">
                  <X class="size-5" />
                </Button>
                <div class="flex items-center justify-center p-4">
                  <img :src="screenshotUrl" class="max-h-[85vh] rounded-lg" alt="Screenshot enlarged" decoding="async" />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <!-- Chart of response times -->
          <UptimeChart :id="siteId" />

          <!-- Last Check -->
          <div class="card p-5" v-if="lastResult">
            <h3 class="text-md font-semibold mb-3">Last Check</h3>
            <div class="flex flex-col gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Status</span>
                <span class="font-medium capitalize" :class="lastCheckStatusClass">{{ lastResult.status }}</span>
              </div>
              <div v-if="lastResult.errorMessage" class="text-sm text-muted-foreground">Error: {{ lastResult.errorMessage }}</div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Response Time</span>
                <span>{{ lastResult.responseTime }} ms</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Status Code</span>
                <span>{{ lastResult.statusCode || '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Checked at</span>
                <span>{{ formatDateTime(lastResult.checked_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Block SSL (horizontal metrics) -->
          <div class="card p-5" v-if="lastSSL">
            <h3 class="text-md font-semibold mb-3">SSL Certificate</h3>
            <div class="stackedwrap gap-3 text-sm">
              <div>
                <span class="block text-muted-foreground">Status</span>
                <span class="font-medium" :class="sslValidClass">
                  {{ lastSSL.valid ? 'Valid' : 'Invalid' }}
                </span>
              </div>
              <div>
                <span class="block text-muted-foreground">Days left</span>
                <span class="font-medium tabular-nums text-foreground">{{ lastSSL.daysLeft }}</span>
              </div>
              <div>
                <span class="block text-muted-foreground">Issuer</span>
                <span class="truncate">{{ lastSSL.issuer || '—' }}</span>
              </div>
              <div>
                <span class="block text-muted-foreground">Expires</span>
                <span>{{ formatDateTime(lastSSL.validTo).split(' ')[0] }}</span>
              </div>
            </div>
          </div>

          <!-- Block Performance (horizontal metrics) -->
          <div class="card p-5" v-if="lastSpeed">
            <h3 class="text-md font-semibold mb-3">Performance</h3>
            <div class="stackedwrap gap-3 gap-y-2 text-sm">
              <div><span class="block text-muted-foreground">Load</span>{{ lastSpeed.loadTime }}ms</div>
              <div><span class="block text-muted-foreground">TTFB</span>{{ lastSpeed?.ttfb?.toFixed?.(0) }} ms</div>
              <div><span class="block text-muted-foreground">DOM</span>{{ lastSpeed?.domContentLoaded?.toFixed?.(0) }} ms</div>
              <div><span class="block text-muted-foreground">Size</span>{{ ((lastSpeed?.pageSize ?? 0) / 1024).toFixed(0) }} KB</div>
              <div><span class="block text-muted-foreground">Req</span>{{ lastSpeed?.requestCount }}</div>
            </div>
          </div>

          <!-- Load Time Trend (if data is available) -->
          <SpeedChart :id="siteId" />

          <!-- AI Anomaly Detection -->
          <AnomalyChart :id="siteId" />
        </div>
      </div>
    </div>
  </div>
</template>
