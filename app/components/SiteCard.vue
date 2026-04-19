<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';
import type { SiteInterface } from '~~/types';

const props = defineProps<{ site: SiteInterface }>();
const siteId = Number(props.site.id);

const faviconUrl = computed(() => {
  const domain = new URL(props.site.url).hostname;
  return `/api/favicon?host=${encodeURIComponent(domain)}`;
});

const { results } = useMonitoring();
const { formatDateTime } = useDate();

const lastResult = computed(() => {
  return results.value[siteId]?.[0] || props.site.lastCheck || null;
});
</script>

<template>
  <div
    class="card px-4 py-2 transition-all cursor-pointer hover:translate-x-[-4px] text-sm grid grid-flow-row items-center justify-between md:grid-flow-col"
    @click="navigateTo(`/sites/${siteId}`)"
  >
    <div class="grid w-fit max-w-fit items-center gap-3 grid-flow-col">
      <img
        :src="faviconUrl"
        :alt="site.name"
        class="min-w-5 min-h-5 w-5 h-5 rounded aspect-square"
        width="20"
        height="20"
        loading="lazy"
        decoding="async"
        @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
      />
      <span class="font-semibold">{{ site.name }}</span>
      <span
        class="meta-pill inline-block w-fit bg-secondary text-secondary-foreground ring-border text-[10px] uppercase tracking-wide"
      >
        {{ site.check_type === 'text' ? 'Text' : 'HTTP' }}
      </span>
      <StatusBadge :status="lastResult?.status ?? 'pending'" size="sm" :animated="true" />
      <span
        v-if="site.isActive"
        class="meta-pill meta-pill-active text-[10px] uppercase tracking-wide"
      >
        Active
      </span>
      <span v-else class="meta-pill meta-pill-paused text-[10px] uppercase tracking-wide"> Paused </span>

      <a
        :href="site.url"
        target="_blank"
        class="flex items-center gap-0.5 text-muted-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-foreground hover:decoration-border"
        @click.stop
      >
        {{ site.url }}
        <ExternalLink class="size-3" />
      </a>
    </div>

    <div class="items-center gap-x-4 w-fit md:flex md:flex-wrap hidden">
      <span class="flex items-center gap-1">
        <span class="text-muted-foreground">Last:</span>
        <span class="font-medium">{{ lastResult?.checked_at ? formatDateTime(lastResult.checked_at) : 'Never' }}</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="text-muted-foreground">Int:</span>
        <span class="font-medium">{{ site.checkInterval }} sec</span>
      </span>
      <span v-if="lastResult?.statusCode" class="flex items-center gap-1">
        <span class="text-muted-foreground">Code:</span>
        <span class="font-medium">{{ lastResult.statusCode }}</span>
      </span>
      <span v-if="lastResult?.errorMessage" class="max-w-[180px] truncate text-xs text-muted-foreground" :title="lastResult.errorMessage">
        {{ lastResult.errorMessage }}
      </span>
    </div>
  </div>
</template>
