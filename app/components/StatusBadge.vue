<script setup lang="ts">
const props = defineProps<{
  status: 'up' | 'down' | 'degraded' | 'pending';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}>();

const statusConfig = {
  up: {
    color: 'bg-success-500',
    text: 'Operational',
    icon: 'heroicons:check-circle-20-solid',
    badgeClass: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
  },
  down: {
    color: 'bg-error-500',
    text: 'Downtime',
    icon: 'heroicons:x-circle-20-solid',
    badgeClass: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
  },
  degraded: {
    color: 'bg-warning-500',
    text: 'Degraded',
    icon: 'heroicons:exclamation-triangle-20-solid',
    badgeClass: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
  },
  pending: {
    color: 'bg-gray-400',
    text: 'Checking...',
    icon: 'heroicons:arrow-path-20-solid',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const currentConfig = computed(() => statusConfig[props.status]);

const showAnimation = computed(() => props.animated);
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="!showText" class="relative">
      <div class="rounded-full" :class="[sizeClasses[size || 'md'], currentConfig.color]" />
      <div v-if="showAnimation" class="absolute inset-0 rounded-full" :class="[sizeClasses[size || 'md'], currentConfig.color, 'animate-ping-slow opacity-75']" />
    </div>
    <span v-else :class="['status-badge', currentConfig.badgeClass]">
      <UIcon :name="currentConfig.icon" class="w-4 h-4 mr-1" />
      {{ currentConfig.text }}
    </span>
  </div>
</template>

<style>
@keyframes ping-slow {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
