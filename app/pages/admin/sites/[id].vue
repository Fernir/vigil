<script setup lang="ts">
import type { SiteInterface } from '~~/types';

definePageMeta({ middleware: 'admin' });

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);
const toast = useToast();

const { data: site } = await useFetch(`/api/admin/sites/${siteId}`);

const form = reactive<Omit<SiteInterface, 'id' | 'lastCheck' | 'updated_at' | 'created_at'>>({
  name: '',
  url: '',
  checkInterval: 5,
  isActive: true,
  check_type: 'http',
  expected_text: '',
  text_condition: 'contains',
  userId: 0,
});

watchEffect(() => {
  if (site.value) {
    form.name = site.value.name;
    form.url = site.value.url;
    form.checkInterval = site.value.checkInterval ?? 30;
    form.isActive = !!site.value.isActive;
    form.check_type = site.value.check_type || 'http';
    form.expected_text = site.value.expected_text || '';
    form.text_condition = site.value.text_condition || 'contains';
    form.userId = site.value.userId;
  }
});

const save = async () => {
  try {
    await $fetch(`/api/admin/sites/${siteId}`, {
      method: 'PATCH',
      body: form,
    });
    toast.add({ title: 'Site updated', color: 'green' });
    await router.push(`/admin/users/${form.userId}`);
  } catch (e) {
    toast.add({ title: 'Failed to update site', color: 'red' });
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton :to="`/admin/users/${form.userId}`" variant="ghost" icon="heroicons:arrow-left">Back</UButton>
      </div>

      <div class="card p-6">
        <h1 class="text-2xl font-bold mb-6">Edit Site: {{ site?.name }}</h1>

        <SiteForm @submit="save" v-model="form">
          <div class="flex gap-2 pt-4">
            <UButton type="submit" color="primary">Save Changes</UButton>
            <UButton color="gray" variant="ghost" :to="`/admin/users/${form.userId}`">Cancel</UButton>
          </div>
        </SiteForm>
      </div>
    </div>
  </div>
</template>
