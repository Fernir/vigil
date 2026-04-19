<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">Page not found</h1>
      <p class="mb-6 text-muted-foreground">The page you are looking for does not exist.</p>
      <Button variant="default" as-child>
        <NuxtLink to="/">Go back home</NuxtLink>
      </Button>
    </div>
  </div>
</template>
