<script setup>
defineProps({
  error: Object,
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="text-center">
      <h1 class="mb-4 text-6xl font-bold text-foreground">
        {{ error?.statusCode || "Error" }}
      </h1>
      <p class="mb-8 text-xl text-muted-foreground">
        {{ error?.message || "Something went wrong" }}
      </p>
      <Button variant="default" as-child>
        <NuxtLink to="/">Go back home</NuxtLink>
      </Button>
    </div>
  </div>
</template>
