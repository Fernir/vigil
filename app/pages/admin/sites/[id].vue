<script setup lang="ts">
import type { SiteInterface } from '~~/types';

definePageMeta({ middleware: 'admin' });

const isLoading = ref(false);

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);
const toast = useToast();

const { data: site } = await useFetch<Partial<SiteInterface>>(`/api/admin/sites/${siteId}`);

const save = async (form: SiteInterface) => {
  isLoading.value = true;

  try {
    await $fetch(`/api/admin/sites/${siteId}`, {
      method: 'PATCH',
      body: form,
    });
    toast.add({ title: 'Site updated', color: 'green' });
    await router.push(`/admin/users/${form.userId}`);
  } catch (e) {
    toast.add({ title: 'Failed to update site', color: 'red' });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton :to="`/admin/users/${site?.userId}`" variant="ghost" icon="heroicons:arrow-left">Back</UButton>
      </div>

      <div class="card p-6">
        <h1 class="text-2xl font-bold mb-6">Edit Site: {{ site?.name }}</h1>

        <SiteForm @submit="save" :initial-data="site" :loading="isLoading">
          <template #default="{ form }">
            <div class="flex gap-2 pt-4">
              <UButton type="submit" color="primary">Save Changes</UButton>
              <UButton color="gray" variant="ghost" :to="`/admin/users/${form.userId}`">Cancel</UButton>
            </div>
          </template>
        </SiteForm>
      </div>
    </div>
  </div>
</template>
