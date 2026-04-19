<template>
  <div class="flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8">
    <div class="flex flex-row items-center justify-center gap-3">
      <NuxtLink to="/" class="flex items-center gap-2">
        <NuxtImg src="/logo.svg" alt="Vigil" class="h-8 w-auto" />
        <span class="text-xl font-bold text-foreground">Vigil</span>
      </NuxtLink>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="card px-4 py-8 sm:px-10">
        <slot />
      </div>
    </div>
  </div>
</template>
