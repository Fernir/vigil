<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import type { SiteInterface } from "~~/types";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Site",
});

const router = useRouter();
const { addSite, loading } = useSites();

const handleSubmit = async (form: SiteInterface) => {
  const result = await addSite(form);
  if (result) {
    router.push("/");
  }
};
</script>

<template>
  <div class="min-h-screen bg-background py-8">
    <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <Button variant="ghost" class="gap-2" as-child>
          <NuxtLink to="/">
            <ArrowLeft class="size-4" />
            Back
          </NuxtLink>
        </Button>
      </div>
      <div class="mb-8">
        <h1 class="mb-2 text-3xl font-bold text-foreground">Add New Site</h1>
        <p class="text-muted-foreground">Add a website or service to monitor</p>
      </div>

      <div class="card p-6">
        <SiteForm @submit="handleSubmit" :loading="loading">
          <div class="flex gap-3 pt-4">
            <Button type="submit" variant="default">Add Site</Button>
            <Button variant="ghost" as-child>
              <NuxtLink to="/">Cancel</NuxtLink>
            </Button>
          </div>
        </SiteForm>
      </div>
    </div>
  </div>
</template>
