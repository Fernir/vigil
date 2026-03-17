<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);

useHead({
  title: "Edit Site",
});

const { sites, fetchSites, updateSite, loading } = useSites();
const { results, fetchSiteHistory } = useMonitoring();
const { formatDateTime } = useDate(); // Импортируем утилиту

const site = computed(() => sites.value.find((s) => s.id === siteId));

const form = reactive({
  name: "",
  url: "",
  checkInterval: 5,
  isActive: true,
});

const errors = ref<Record<string, string>>({});

// Загружаем данные
onMounted(async () => {
  await fetchSites();
  await fetchSiteHistory(siteId, 30);

  if (site.value) {
    form.name = site.value.name;
    form.url = site.value.url;
    form.checkInterval = site.value.checkInterval;
    form.isActive = !!site.value.isActive; // преобразуем в булево
  } else {
    router.push("/dashboard");
  }
});

const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!form.name) newErrors.name = "Name is required";
  if (!form.url) newErrors.url = "URL is required";
  else if (!form.url.match(/^https?:\/\/.+/)) {
    newErrors.url = "URL must start with http:// or https://";
  }
  if (form.checkInterval < 1 || form.checkInterval > 60) {
    newErrors.checkInterval = "Interval must be between 1 and 60 minutes";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;

  const result = await updateSite(siteId, form);
  if (result) {
    router.push("/");
  }
};

// Статистика для графиков
const chartData = computed(() => {
  return (results.value[siteId] || []).slice().reverse();
});

const uptimePercentage = computed(() => {
  const data = results.value[siteId] || [];
  if (data.length === 0) return 100;

  const up = data.filter((r) => r.status === "up").length;
  return ((up / data.length) * 100).toFixed(2);
});

const avgResponseTime = computed(() => {
  const data = results.value[siteId] || [];
  if (data.length === 0) return 0;

  const sum = data.reduce((acc, r) => acc + r.responseTime, 0);
  return Math.round(sum / data.length);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-5">
        <UButton
          to="/"
          color="transparent"
          variant="ghost"
          icon="heroicons:arrow-left"
          v-cloak
        >
          Back to Dashboard
        </UButton>
      </div>
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Manage monitoring settings for {{ site?.name }}
        </h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Edit Form -->
        <div class="lg:col-span-1">
          <div class="card p-6">
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Site Name
                </label>
                <UInput v-model="form.name" :error="errors.name" />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  URL
                </label>
                <UInput v-model="form.url" :error="errors.url" />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Check Interval (minutes)
                </label>
                <UInput
                  v-model="form.checkInterval"
                  type="number"
                  min="1"
                  max="60"
                  :error="errors.checkInterval"
                />
              </div>

              <div class="flex items-center gap-2">
                <UToggle v-model="form.isActive" />
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Active monitoring
                </span>
              </div>

              <div class="flex gap-3 pt-4">
                <UButton type="submit" color="primary" :loading="loading">
                  Save Changes
                </UButton>
                <UButton color="gray" variant="ghost" to="/dashboard">
                  Cancel
                </UButton>
              </div>
            </form>
          </div>
        </div>

        <!-- Statistics -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Stats Cards -->
          <div class="grid grid-cols-2 gap-4">
            <div class="card p-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Uptime (30d)
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ uptimePercentage }}%
              </p>
            </div>
            <div class="card p-4">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Avg Response
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ avgResponseTime }}ms
              </p>
            </div>
          </div>

          <!-- Uptime Chart -->
          <div class="card p-6">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Response Time History
            </h3>
            <UptimeChart :data="chartData" :height="300" />
          </div>

          <!-- Recent Checks -->
          <div class="card p-6">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Recent Checks
            </h3>
            <div class="space-y-2">
              <div
                v-for="result in results[siteId]?.slice(0, 10)"
                :key="result.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div class="flex items-center gap-3">
                  <StatusBadge :status="result.status" />
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDateTime(result.checkedAt) }}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ result.responseTime }}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
