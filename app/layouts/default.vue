<script setup lang="ts">
const colorMode = useColorMode();
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />

    <main>
      <slot />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>
