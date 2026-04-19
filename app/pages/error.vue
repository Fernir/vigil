<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

const route = useRoute();

const title = computed(() =>
  route.query.statusCode === "404" ? "Page not found" : "An error occurred",
);

const description = computed(() =>
  route.query.statusCode === "404"
    ? "The page you are looking for does not exist."
    : "Something went wrong. Please try again later.",
);
</script>

<template>
  <div class="card p-8 text-center">
    <h1 class="text-4xl font-bold mb-4">{{ title }}</h1>
    <p class="mb-6 text-muted-foreground">{{ description }}</p>
    <Button variant="default" as-child>
      <NuxtLink to="/">Go back home</NuxtLink>
    </Button>
  </div>
</template>
