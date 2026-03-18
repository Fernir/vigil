<script setup lang="ts">
import type { SiteInterface } from "../../server/utils/db";

const props = defineProps<{
  site: SiteInterface;
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
  if (!props?.site?.lastCheck?.checked_at) return "Never";
  try {
    return new Date(props.site.lastCheck.checked_at).toLocaleString();
  } catch {
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
  <div class="card p-4 hover:shadow-md transition-shadow">
    <div class="flex flex-col gap-3">
      <!-- Верхняя строка: название, тип, статус, кнопки (если detailed) -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ site.name }}
          </h3>
          <span class="text-xs bg-black text-white px-1.5 py-0.5 rounded">
            {{ site.check_type === "text" ? "Text" : "HTTP" }}
          </span>
          <StatusBadge :status="status" />
          <span
            v-if="!site.isActive"
            class="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-1.5 py-0.5 rounded"
          >
            Paused
          </span>
        </div>
        <div v-if="detailed" class="flex gap-1 ml-2 shrink-0">
          <UButton
            color="gray"
            variant="ghost"
            icon="heroicons:pencil-square-20-solid"
            :to="`/sites/${site.id}`"
            size="xs"
          />
          <UButton
            color="red"
            variant="ghost"
            icon="heroicons:trash-20-solid"
            size="xs"
            @click="emit('delete', site.id)"
          />
        </div>
      </div>

      <!-- Строка с URL -->
      <a
        :href="site.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 w-fit"
      >
        {{ site.url }}
        <UIcon
          name="heroicons:arrow-top-right-on-square-20-solid"
          class="w-3 h-3"
        />
      </a>

      <!-- Метрики в одну строку -->
      <div class="flex items-center gap-6 text-sm mt-1 flex-wrap">
        <div class="flex items-center gap-1">
          <span class="text-gray-500 dark:text-gray-400">Uptime:</span>
          <span class="font-medium" :class="statusColor"
            >{{ uptimePercentage }}%</span
          >
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 dark:text-gray-400">Avg:</span>
          <span class="font-medium">{{ avgResponseTime }}ms</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 dark:text-gray-400">Last:</span>
          <span class="font-medium">{{ lastChecked }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-gray-500 dark:text-gray-400">Interval:</span>
          <span class="font-medium">{{ site.checkInterval }} min</span>
        </div>
        <div
          v-if="props.site?.lastCheck?.statusCode"
          class="flex items-center gap-1"
        >
          <span class="text-gray-500 dark:text-gray-400">Code:</span>
          <span class="font-medium">{{ props.site.lastCheck.statusCode }}</span>
        </div>
        <div
          v-if="props.site?.lastCheck?.errorMessage"
          class="flex items-center gap-1"
        >
          <span
            class="text-red-500 text-xs truncate max-w-[200px]"
            :title="props.site.lastCheck.errorMessage"
          >
            Error: {{ props.site.lastCheck.errorMessage }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
