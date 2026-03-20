<script setup lang="ts">
import type { CheckResultInterface, SiteInterface } from "~~/types";

const props = defineProps<{ site: SiteInterface }>();
const siteId = Number(props.site.id);
const lastCheck = ref<CheckResultInterface>();

const handleSSEUpdate = (ev: Event) => {
  const { detail } = ev as CustomEvent;

  if (detail.siteId === siteId && detail.type === "http") {
    lastCheck.value = detail;
  }
};

onMounted(() => {
  window.addEventListener("monitoring-update", handleSSEUpdate);
});

onUnmounted(() => {
  window.removeEventListener("monitoring-update", handleSSEUpdate);
});

const lastResult = computed(
  () => lastCheck.value || props.site.lastCheck || null,
);
</script>

<template>
  <div
    class="card px-4 py-2 hover:shadow-md transition-all cursor-pointer hover:translate-x-[-4px] text-sm flex items-center justify-between"
    @click="navigateTo(`/sites/${siteId}`)"
  >
    <div class="flex items-center gap-3 flex-wrap">
      <span class="font-semibold">{{ site.name }}</span>
      <span class="text-[10px] bg-black text-white px-1.5 rounded">{{
        site.check_type === "text" ? "Text" : "HTTP"
      }}</span>
      <StatusBadge :status="lastResult?.status ?? 'pending'" size="sm" />
      <span
        v-if="!site.isActive"
        class="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded"
        >Paused</span
      >

      <a
        :href="site.url"
        target="_blank"
        class="text-gray-500 hover:text-primary-600 flex items-center gap-0.5"
        @click.stop
      >
        {{ site.url }}
        <UIcon
          name="heroicons:arrow-top-right-on-square-20-solid"
          class="w-3 h-3"
        />
      </a>
    </div>

    <div class="flex items-center gap-4 flex-shrink-0">
      <span class="flex items-center gap-1">
        <span class="text-gray-500">Last:</span>
        <span class="font-medium">{{
          lastResult?.checked_at
            ? new Date(lastResult.checked_at).toLocaleString()
            : "Never"
        }}</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="text-gray-500">Int:</span>
        <span class="font-medium">{{ site.checkInterval }} sec</span>
      </span>
      <span v-if="lastResult?.statusCode" class="flex items-center gap-1">
        <span class="text-gray-500">Code:</span>
        <span class="font-medium">{{ lastResult.statusCode }}</span>
      </span>
      <span
        v-if="lastResult?.errorMessage"
        class="text-red-500 text-xs truncate max-w-[180px]"
        :title="lastResult.errorMessage"
      >
        {{ lastResult.errorMessage }}
      </span>
    </div>
  </div>
</template>
