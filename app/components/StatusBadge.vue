<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-vue-next";

const props = defineProps<{
  status: "up" | "down" | "degraded" | "pending";
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}>();

const statusConfig = {
  up: {
    dot: "bg-success-500",
    text: "Operational",
    icon: CheckCircle2,
    badgeClass: "status-badge-up",
  },
  down: {
    dot: "bg-error-500",
    text: "Downtime",
    icon: XCircle,
    badgeClass: "status-badge-down",
  },
  degraded: {
    dot: "bg-warning-500",
    text: "Degraded",
    icon: AlertTriangle,
    badgeClass: "status-badge-degraded",
  },
  pending: {
    dot: "bg-muted-foreground/60",
    text: "Checking...",
    icon: Loader2,
    badgeClass: "bg-muted text-muted-foreground ring-1 ring-border",
  },
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const currentConfig = computed(() => statusConfig[props.status]);

const showAnimation = computed(() => props.animated);

const IconComponent = computed(() => currentConfig.value.icon);
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="!showText" class="relative">
      <div class="rounded-full" :class="[sizeClasses[size || 'md'], currentConfig.dot]" />
      <div
        v-if="showAnimation"
        class="absolute inset-0 rounded-full opacity-75 animate-ping-slow"
        :class="[sizeClasses[size || 'md'], currentConfig.dot]"
      />
    </div>
    <span v-else :class="['status-badge', currentConfig.badgeClass]">
      <component
        :is="IconComponent"
        class="mr-1 size-4"
        :class="{ 'animate-spin': status === 'pending' }"
      />
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
