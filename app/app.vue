<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const cookie = useCookie("color-mode");

useHead({
  titleTemplate: (title) =>
    title ? `${title} - Vigil` : "Vigil - Status Page",
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "description", content: "Real-time status page for your services" },
  ],
  htmlAttrs: {
    lang: "en",
    class: cookie.value === "dark" ? "dark" : "",
  },
});
</script>
