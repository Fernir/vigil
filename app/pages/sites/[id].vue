<script setup lang="ts">
import type { SiteInterface } from "~~/types";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);

useHead({ title: "Edit Site" });

const showModal = ref(false);

const {
  getLatestSSL,
  getLatestSpeed,
  getLatestScreenshot,
  speedResults,
  fetchSpeedHistory,
  fetchSSLHistory,
  fetchScreenshotData,
  results,
  fetchSiteHistory,
} = useMonitoring();

const lastSSL = computed(() => getLatestSSL(siteId));
const lastSpeed = computed(() => getLatestSpeed(siteId));
const lastScreenshot = computed(() => getLatestScreenshot(siteId));

const { sites, fetchSites, updateSite, loading } = useSites();
const { formatDateTime } = useDate();

const site = computed(() => sites.value.find((s) => s.id === siteId));

const form = reactive<Partial<SiteInterface>>({
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
  await fetchSiteHistory(siteId);
  await fetchSpeedHistory(siteId);
  await fetchSSLHistory(siteId);
  await fetchScreenshotData(siteId);

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
  if (Number(form.checkInterval) < 1 || Number(form.checkInterval) > 60) {
    newErrors.checkInterval = "Interval must be between 1 and 60 minutes";
  }
  if (form.check_type === "text" && !form.expected_text) {
    newErrors.expected_text = "Expected text is required for text check";
  }
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleDelete = async () => {
  if (
    confirm(
      "Are you sure you want to delete this site? This action cannot be undone.",
    )
  ) {
    try {
      const { deleteSite } = useSites();
      await deleteSite(siteId);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete site:", error);
    }
  }
};

const handleSubmit = async () => {
  if (!validate()) return;
  const result = await updateSite(siteId, form);
  if (result) router.push("/");
};

const chartDataUptime = computed(() =>
  (results.value[siteId] || []).slice().reverse(),
);

const chartDataSpeedResults = computed(() =>
  (speedResults.value[siteId] || []).slice().reverse(),
);

const lastResult = computed(() => results.value[siteId]?.[0] || null);
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left">
          Back
        </UButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column: editing form -->
        <div class="lg:col-span-1 space-y-6">
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
                min="30"
                max="3600"
                placeholder="Interval (sec)"
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

                <UButton
                  color="red"
                  variant="soft"
                  icon="heroicons:trash-20-solid"
                  size="sm"
                  @click="handleDelete"
                >
                  Delete
                </UButton>
              </div>
            </form>
          </div>
          <div class="card p-5">
            <SSEIndicator />
          </div>
        </div>

        <!-- Right column: all metrics and charts -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-5" v-if="lastScreenshot">
            <h3 class="text-md font-semibold mb-3">Last Screenshot</h3>
            <img
              :src="`data:image/png;base64,${lastScreenshot.image_base64}`"
              alt="Website screenshot"
              class="w-full max-h-64 object-cover border rounded-lg shadow-sm cursor-pointer"
              @click="showModal = true"
            />
            <p class="text-xs text-gray-500 mt-2 text-center">
              Click to enlarge
            </p>
            <!-- Modal window for enlarged view -->
            <UModal
              v-model="showModal"
              centered
              :ui="{ width: 'w-fit sm:max-w-none' }"
            >
              <UButton
                variant="link"
                color="white"
                size="lg"
                class="fixed top-4 right-4"
                icon="heroicons:x-mark-solid"
                @click.stop="showModal = false"
              />
              <div class="p-4 flex items-center justify-center h-full">
                <img
                  :src="`data:image/png;base64,${lastScreenshot.image_base64}`"
                  class="max-h-full rounded-lg"
                />
              </div>
            </UModal>
          </div>

          <!-- Chart of response times -->
          <div class="card p-5">
            <h3 class="text-md font-semibold mb-3">Response Time History</h3>
            <UptimeChart :data="chartDataUptime" :height="250" />
          </div>

          <!-- Last Check -->
          <div class="card p-5" v-if="lastResult">
            <h3 class="text-md font-semibold mb-3">Last Check</h3>
            <div class="flex flex-col gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Status</span>
                <span
                  :class="{
                    'text-green-600': lastResult.status === 'up',
                    'text-yellow-600': lastResult.status === 'degraded',
                    'text-red-600': lastResult.status === 'down',
                  }"
                  >{{ lastResult.status }}</span
                >
              </div>
              <div v-if="lastResult.errorMessage" class="text-red-500 text-sm">
                Error: {{ lastResult.errorMessage }}
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Response Time</span>
                <span>{{ lastResult.responseTime }} ms</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Status Code</span>
                <span>{{ lastResult.statusCode || "—" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Checked at</span>
                <span>{{ formatDateTime(lastResult.checked_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Block SSL (horizontal metrics) -->
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

          <!-- Block Performance (horizontal metrics) -->
          <div class="card p-5" v-if="lastSpeed">
            <h3 class="text-md font-semibold mb-3">Performance</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <span class="text-gray-500 block">Load</span
                >{{ lastSpeed.loadTime }}ms
              </div>
              <div>
                <span class="text-gray-500 block">TTFB</span
                >{{ lastSpeed?.ttfb?.toFixed?.(0) }} ms
              </div>
              <div>
                <span class="text-gray-500 block">DOM</span
                >{{ lastSpeed?.domContentLoaded?.toFixed?.(0) }} ms
              </div>
              <div>
                <span class="text-gray-500 block">Size</span
                >{{ ((lastSpeed?.pageSize ?? 0) / 1024).toFixed(0) }} KB
              </div>
              <div>
                <span class="text-gray-500 block">Req</span
                >{{ lastSpeed?.requestCount }}
              </div>
            </div>
          </div>

          <!-- Load Time Trend (if data is available) -->
          <div class="card p-5" v-if="chartDataSpeedResults?.length > 1">
            <h3 class="text-md font-semibold mb-3">Load Time Trend</h3>
            <SpeedChart :data="chartDataSpeedResults" :height="200" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
