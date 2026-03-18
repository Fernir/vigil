<script setup lang="ts">
import type { Site, CheckResult } from "../../server/utils/db";

const props = defineProps<{
  site: Site;
  detailed?: boolean;
}>();

const siteId = Number(props.site.id);

const { loggedIn } = useUserSession();
const { results, fetchSiteHistory } = useMonitoring();
const { uptimePercentage, avgResponseTime } = useSiteMetrics(siteId);

const emit = defineEmits<{
  (e: "delete", id: number): void;
}>();

const status = computed(() => props.site?.lastCheck?.status || "pending");

const statusColor = computed(() => {
  switch (status.value) {
    case "up":
      return "text-green-600 dark:text-green-400";
    case "down":
      return "text-red-600 dark:text-red-400";
    case "degraded":
      return "text-yellow-600 dark:text-yellow-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
});

const lastChecked = computed(() => {
  // Проверяем, что checkedAt существует
  if (!props?.site?.lastCheck?.checkedAt) return "Never";

  try {
    return new Date(props?.site.lastCheck.checkedAt).toLocaleString();
  } catch (e) {
    return "Invalid date";
  }
});

onMounted(() => {
  if (loggedIn.value) {
    fetchSiteHistory(props.site.id);
  }
});
</script>

<template>
  <div class="card p-6 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ site.name }}
          </h3>
          <span class="text-xs bg-black text-white px-2 py-1 rounded">
            {{ site.check_type === "text" ? "Text check" : "HTTP" }}
          </span>
          <StatusBadge :status="status" />
          <span
            v-if="!site.isActive"
            class="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded"
          >
            Paused
          </span>
        </div>

        <a
          :href="site.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 mb-4 w-fit"
        >
          {{ site.url }}
          <UIcon
            name="heroicons:arrow-top-right-on-square-20-solid"
            class="w-4 h-4"
          />
        </a>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Uptime (30d)
            </div>
            <div class="text-lg font-semibold" :class="statusColor">
              {{ uptimePercentage }}%
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Avg Response
            </div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ avgResponseTime }}ms
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Last Check
            </div>
            <div class="text-sm text-gray-900 dark:text-white">
              {{ lastChecked }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Interval</div>
            <div class="text-sm text-gray-900 dark:text-white">
              Every {{ site.checkInterval }} min
            </div>
          </div>
        </div>

        <!-- Последний статус код если есть -->
        <div
          v-if="props.site?.lastCheck?.statusCode"
          class="mt-3 text-xs text-gray-500 dark:text-gray-400"
        >
          Last status code: {{ props.site?.lastCheck?.statusCode }}
        </div>
        <div
          v-if="props.site?.lastCheck?.errorMessage"
          class="mt-3 text-xs text-red-500 dark:text-red-400"
        >
          Error: {{ props.site?.lastCheck?.errorMessage }}
        </div>
      </div>

      <div v-if="detailed" class="flex gap-2 ml-4">
        <UButton
          color="gray"
          variant="ghost"
          icon="heroicons:pencil-square-20-solid"
          :to="`/sites/${site.id}`"
        />
        <UButton
          color="red"
          variant="ghost"
          icon="heroicons:trash-20-solid"
          @click="emit('delete', site.id)"
        />
      </div>
    </div>
  </div>
</template>
