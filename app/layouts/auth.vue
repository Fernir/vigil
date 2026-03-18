<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <div class="flex flex-row items-center justify-center gap-3">
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="/logo.svg" alt="Vigil" class="h-8 w-auto" />
        <span class="text-xl font-bold text-gray-900 dark:text-white"
          >Vigil</span
        >
      </NuxtLink>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="card py-8 px-4 sm:px-10">
        <slot />
      </div>
    </div>
  </div>
</template>
