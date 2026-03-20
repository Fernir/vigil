<script setup lang="ts">
import { useMonitoring } from "../composables/useMonitoring";

const { sseConnected, connectToSSE } = useMonitoring();

onMounted(() => {
  connectToSSE();
});
</script>

<template>
  <!-- Indicator for SSE (always only on client) -->
  <ClientOnly>
    <div class="flex items-center gap-2 text-sm">
      <div
        class="w-2 h-2 rounded-full"
        :class="sseConnected ? 'bg-green-500' : 'bg-red-500'"
      />
      <span class="text-gray-600 dark:text-gray-400">
        {{ sseConnected ? "Live updates connected" : "Reconnecting..." }}
      </span>
    </div>
  </ClientOnly>
</template>
