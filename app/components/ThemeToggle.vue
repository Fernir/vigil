<script setup lang="ts">
const colorMode = useColorMode();

const isDark = computed({
  get: () => colorMode.value === "dark",
  set: (value) => {
    colorMode.preference = value ? "dark" : "light";
  },
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
};
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'heroicons:moon-20-solid' : 'heroicons:sun-20-solid'"
      color="gray"
      variant="ghost"
      @click="toggleTheme"
    />
    <template #fallback>
      <!-- Placeholder for server-side rendering -->
      <UButton
        icon="heroicons:sun-20-solid"
        color="gray"
        variant="ghost"
        disabled
      />
    </template>
  </ClientOnly>
</template>
