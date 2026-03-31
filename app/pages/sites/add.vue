<script setup lang="ts">
import type { SiteInterface } from '~~/types';

definePageMeta({
  middleware: 'auth',
});

useHead({
  title: 'Add Site',
});

const router = useRouter();
const { addSite, loading } = useSites();

const handleSubmit = async (form: SiteInterface) => {
  const result = await addSite(form);
  if (result) {
    router.push('/');
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left">Back</UButton>
      </div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Site</h1>
        <p class="text-gray-600 dark:text-gray-400">Add a website or service to monitor</p>
      </div>

      <div class="card p-6">
        <SiteForm @submit="handleSubmit" :loading="loading">
          <div class="flex gap-3 pt-4">
            <UButton type="submit" color="primary">Add Site</UButton>
            <UButton color="gray" variant="ghost" to="/">Cancel</UButton>
          </div>
        </SiteForm>
      </div>
    </div>
  </div>
</template>
