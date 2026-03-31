<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <UNotifications />
  </ClientOnly>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const cookie = useCookie('color-mode');

const themeClass = computed(() => {
  const mode = cookie.value || colorMode.value;

  return mode === 'dark' ? 'dark' : '';
});

useHead({
  titleTemplate: (title) => (title ? `${title} - Vigil` : 'Vigil - Status Page'),
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    { name: 'description', content: 'Real-time status page for your services' },
  ],
  htmlAttrs: {
    lang: 'en',
    class: themeClass,
  },
});
</script>
