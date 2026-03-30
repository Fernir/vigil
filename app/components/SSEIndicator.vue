<script setup lang="ts">
import { useMonitoring } from '../composables/useMonitoring';

const { sseConnected, connectToSSE } = useMonitoring();
const isClient = ref(false);

onMounted(() => {
  isClient.value = true;
  connectToSSE();
});
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <div class="w-2 h-2 rounded-full" :class="isClient ? (sseConnected ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-400'" />
    <span class="text-gray-600 dark:text-gray-400">
      {{ isClient ? (sseConnected ? 'Live updates connected' : 'Reconnecting...') : 'Connecting...' }}
    </span>
  </div>
</template>
