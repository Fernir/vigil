<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";

const colorMode = useColorMode();
const cookie = useCookie("color-mode");
const isHydrated = ref(false);

onMounted(() => {
  isHydrated.value = true;
});

const isDark = computed({
  get: () => {
    if (cookie.value) return cookie.value === "dark";
    return colorMode.value === "dark";
  },
  set: (value: boolean) => {
    colorMode.preference = value ? "dark" : "light";
  },
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
};
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="Toggle theme" @click="toggleTheme">
    <Sun v-if="isHydrated && !isDark" class="size-4" />
    <Moon v-else-if="isHydrated" class="size-4" />
    <Sun v-else class="size-4 opacity-60" />
  </Button>
</template>
