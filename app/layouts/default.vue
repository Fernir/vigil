<script setup lang="ts">
useColorMode();
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </div>
</template>
