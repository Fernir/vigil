<script setup lang="ts">
import type { SiteInterface } from '~~/types';

const props = defineProps<{ site: SiteInterface }>();
const siteId = Number(props.site.id);

const faviconUrl = computed(() => {
  const domain = new URL(props.site.url).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
});

const { results } = useMonitoringStore();
const { formatDateTime } = useDate();

const lastResult = computed(() => {
  return results[siteId]?.[0] || props.site.lastCheck || null;
});
</script>

<template>
  <div
    class="card px-4 py-2 transition-all cursor-pointer hover:translate-x-[-4px] text-sm grid grid-flow-row items-center justify-between md:grid-flow-col"
    @click="navigateTo(`/sites/${siteId}`)"
  >
    <div class="grid w-fit max-w-fit items-center gap-3 grid-flow-col">
      <img :src="faviconUrl" :alt="site.name" class="w-5 h-5 rounded" @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')" />
      <span class="font-semibold">{{ site.name }}</span>
      <span class="inline-block w-fit text-[10px] bg-black text-white px-1.5 rounded">{{ site.check_type === 'text' ? 'Text' : 'HTTP' }}</span>
      <StatusBadge :status="lastResult?.status ?? 'pending'" size="sm" />
      <span v-if="!site.isActive" class="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">Paused</span>

      <a :href="site.url" target="_blank" class="text-gray-500 hover:text-primary-600 flex items-center gap-0.5" @click.stop>
        {{ site.url }}
        <UIcon name="heroicons:arrow-top-right-on-square-20-solid" class="w-3 h-3" />
      </a>
    </div>

    <div class="items-center gap-x-4 w-fit flex flex-wrap md:grid md:grid-flow-col">
      <span class="flex items-center gap-1">
        <span class="text-gray-500">Last:</span>
        <span class="font-medium">{{ lastResult?.checked_at ? formatDateTime(lastResult.checked_at) : 'Never' }}</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="text-gray-500">Int:</span>
        <span class="font-medium">{{ site.checkInterval }} sec</span>
      </span>
      <span v-if="lastResult?.statusCode" class="flex items-center gap-1">
        <span class="text-gray-500">Code:</span>
        <span class="font-medium">{{ lastResult.statusCode }}</span>
      </span>
      <span v-if="lastResult?.errorMessage" class="text-red-500 text-xs truncate max-w-[180px]" :title="lastResult.errorMessage">
        {{ lastResult.errorMessage }}
      </span>
    </div>
  </div>
</template>
