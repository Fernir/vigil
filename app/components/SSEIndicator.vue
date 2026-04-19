<script setup lang="ts">
const { sseConnected } = useMonitoring();
const isClient = ref(false);

onMounted(() => {
  isClient.value = true;
});

const dotClass = computed(() => {
  if (!isClient.value) return 'bg-muted-foreground/50';

  return sseConnected.value ? 'bg-success-500' : 'bg-warning-500';
});
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <div class="h-2 w-2 rounded-full transition-colors" :class="dotClass" />
    <span class="text-muted-foreground">
      {{ isClient ? (sseConnected ? 'Live updates connected' : 'Reconnecting...') : 'Connecting...' }}
    </span>
  </div>
</template>
