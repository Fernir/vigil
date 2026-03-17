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
    <footer class="border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Vigil - Open Source Status Page
        </p>
      </div>
    </footer>
  </div>
</template>
