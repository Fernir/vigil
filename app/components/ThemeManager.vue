<script setup lang="ts">
const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="
        colorMode.value === 'dark'
          ? 'heroicons:moon-20-solid'
          : 'heroicons:sun-20-solid'
      "
      color="gray"
      variant="ghost"
      @click="toggleTheme"
    />
    <template #fallback>
      <UButton
        icon="heroicons:sun-20-solid"
        color="gray"
        variant="ghost"
        disabled
      />
    </template>
  </ClientOnly>
</template>
