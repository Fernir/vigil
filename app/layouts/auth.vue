<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <div class="flex flex-row items-center justify-center gap-3">
      <div class="flex justify-center">
        <div
          class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center"
        >
          <span class="text-white font-bold text-2xl">V</span>
        </div>
      </div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">Vigil</div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="card py-8 px-4 sm:px-10">
        <slot />
      </div>
    </div>
  </div>
</template>
