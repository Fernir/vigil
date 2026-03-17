<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);

useHead({ title: "Edit Site" });

const { lastSSL, lastSpeed, sslResults, speedResults } = useSiteMetrics(siteId);
const { sites, fetchSites, updateSite, loading } = useSites();
const { results, fetchSiteHistory } = useMonitoring();
const { formatDateTime } = useDate();

const site = computed(() => sites.value.find((s) => s.id === siteId));

const form = reactive({
  name: "",
  url: "",
  checkInterval: 5,
  isActive: true,
  check_type: "http",
  expected_text: "",
  text_condition: "contains",
});

const errors = ref<Record<string, string>>({});

onMounted(async () => {
  await fetchSites();
  await fetchSiteHistory(siteId, 30);
  if (site.value) {
    form.name = site.value.name;
    form.url = site.value.url;
    form.checkInterval = site.value.checkInterval;
    form.isActive = !!site.value.isActive;
    form.check_type = site.value.check_type || "http";
    form.expected_text = site.value.expected_text || "";
    form.text_condition = site.value.text_condition || "contains";
  } else {
    router.push("/");
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
  if (form.check_type === "text" && !form.expected_text) {
    newErrors.expected_text = "Expected text is required for text check";
  }
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  const result = await updateSite(siteId, form);
  if (result) router.push("/");
};

const chartData = computed(() =>
  (results.value[siteId] || []).slice().reverse(),
);

const uptimePercentage = computed(() => {
  const data = results.value[siteId] || [];
  if (!data.length) return 100;
  const up = data.filter((r) => r.status === "up").length;
  return ((up / data.length) * 100).toFixed(2);
});

const avgResponseTime = computed(() => {
  const data = results.value[siteId] || [];
  if (!data.length) return 0;
  const sum = data.reduce((acc, r) => acc + r.responseTime, 0);
  return Math.round(sum / data.length);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая колонка: форма редактирования -->
        <div class="lg:col-span-1">
          <div class="card p-5">
            <h2 class="text-lg font-semibold mb-4">Settings</h2>
            <form @submit.prevent="handleSubmit" class="space-y-4">
              <UInput
                v-model="form.name"
                placeholder="Site name"
                :error="errors.name"
              />
              <UInput
                v-model="form.url"
                placeholder="https://..."
                :error="errors.url"
              />
              <UInput
                v-model="form.checkInterval"
                type="number"
                min="1"
                max="60"
                placeholder="Interval (min)"
                :error="errors.checkInterval"
              />
              <div class="flex items-center gap-2">
                <UToggle v-model="form.isActive" />
                <span class="text-sm">Active monitoring</span>
              </div>

              <div>
                <USelect
                  v-model="form.check_type"
                  :options="[
                    { label: 'HTTP Status', value: 'http' },
                    { label: 'Text on page', value: 'text' },
                  ]"
                />
              </div>

              <div v-if="form.check_type === 'text'" class="space-y-2">
                <UInput
                  v-model="form.expected_text"
                  placeholder="Expected text"
                  :error="errors.expected_text"
                />
                <div class="flex gap-3 text-sm">
                  <label class="flex items-center gap-1">
                    <URadio v-model="form.text_condition" value="contains" />
                    <span>contains</span>
                  </label>
                  <label class="flex items-center gap-1">
                    <URadio
                      v-model="form.text_condition"
                      value="not_contains"
                    />
                    <span>not contains</span>
                  </label>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <UButton
                  type="submit"
                  color="primary"
                  :loading="loading"
                  size="sm"
                >
                  Save
                </UButton>
                <UButton color="gray" variant="ghost" to="/dashboard" size="sm">
                  Cancel
                </UButton>
              </div>
            </form>
          </div>
        </div>

        <!-- Правая колонка: все метрики и графики -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Две быстрые карточки -->
          <div class="grid grid-cols-2 gap-4">
            <div class="card p-4">
              <p class="text-xs text-gray-500">Uptime (30d)</p>
              <p class="text-2xl font-bold">{{ uptimePercentage }}%</p>
            </div>
            <div class="card p-4">
              <p class="text-xs text-gray-500">Avg Response</p>
              <p class="text-2xl font-bold">{{ avgResponseTime }} ms</p>
            </div>
          </div>

          <!-- График времени ответа -->
          <div class="card p-5">
            <h3 class="text-md font-semibold mb-3">Response Time History</h3>
            <UptimeChart :data="chartData" :height="250" />
          </div>

          <!-- Блок SSL (горизонтальные метрики) -->
          <div class="card p-5" v-if="lastSSL">
            <h3 class="text-md font-semibold mb-3">SSL Certificate</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span class="text-gray-500 block">Status</span>
                <span
                  :class="lastSSL.valid ? 'text-green-600' : 'text-red-600'"
                >
                  {{ lastSSL.valid ? "Valid" : "Invalid" }}
                </span>
              </div>
              <div>
                <span class="text-gray-500 block">Days left</span>
                <span
                  :class="{
                    'text-green-600': lastSSL.daysLeft > 30,
                    'text-yellow-600':
                      lastSSL.daysLeft <= 30 && lastSSL.daysLeft > 7,
                    'text-red-600': lastSSL.daysLeft <= 7,
                  }"
                  >{{ lastSSL.daysLeft }}</span
                >
              </div>
              <div>
                <span class="text-gray-500 block">Issuer</span>
                <span class="truncate">{{ lastSSL.issuer || "—" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Expires</span>
                <span>{{ formatDateTime(lastSSL.validTo).split(" ")[0] }}</span>
              </div>
            </div>
          </div>

          <!-- Блок Performance (горизонтальные метрики) -->
          <div class="card p-5" v-if="lastSpeed">
            <h3 class="text-md font-semibold mb-3">Performance</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <span class="text-gray-500 block">Load</span
                >{{ lastSpeed.loadTime }}ms
              </div>
              <div>
                <span class="text-gray-500 block">TTFB</span
                >{{ lastSpeed.ttfb.toFixed(0) }} ms
              </div>
              <div>
                <span class="text-gray-500 block">DOM</span
                >{{ lastSpeed.domContentLoaded.toFixed(0) }} ms
              </div>
              <div>
                <span class="text-gray-500 block">Size</span
                >{{ (lastSpeed.pageSize / 1024).toFixed(0) }} KB
              </div>
              <div>
                <span class="text-gray-500 block">Req</span
                >{{ lastSpeed.requestCount }}
              </div>
            </div>
          </div>

          <!-- Тренд скорости (если есть данные) -->
          <div class="card p-5" v-if="speedResults?.length > 1">
            <h3 class="text-md font-semibold mb-3">Load Time Trend</h3>
            <SpeedChart :data="speedResults" :height="200" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
