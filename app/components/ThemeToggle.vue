<script setup lang="ts">
const colorMode = useColorMode();
const cookie = useCookie('color-mode');
const isHydrated = ref(false);

onMounted(() => {
  isHydrated.value = true;
});

const isDark = computed({
  get: () => {
    if (cookie.value) return cookie.value === 'dark';
    return colorMode.value === 'dark';
  },
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light';
  },
});

const icon = computed(() => {
  if (!isHydrated.value) {
    // Keep server + client initial render stable for hydration
    return 'heroicons:sun-20-solid';
  }
  return isDark.value ? 'heroicons:moon-20-solid' : 'heroicons:sun-20-solid';
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
};
</script>

<template>
  <UButton :icon="icon" color="gray" variant="ghost" @click="toggleTheme" />
</template>
