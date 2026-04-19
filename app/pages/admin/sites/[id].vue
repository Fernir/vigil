<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import { toast } from "vue-sonner";
import type { SiteInterface } from "~~/types";

definePageMeta({ middleware: "admin" });

const isLoading = ref(false);

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);

const { data: site } = await useFetch<Partial<SiteInterface>>(`/api/admin/sites/${siteId}`);

const save = async (form: SiteInterface) => {
  isLoading.value = true;

  try {
    await $fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      body: form,
    });
    toast.success("Site updated");
    await router.push(`/admin/users/${form.userId}`);
  } catch (e) {
    toast.error("Failed to update site");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-background py-8">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <Button variant="ghost" class="gap-2" as-child>
          <NuxtLink :to="`/admin/users/${site?.userId}`">
            <ArrowLeft class="size-4" />
            Back
          </NuxtLink>
        </Button>
      </div>

      <div class="card p-6">
        <h1 class="mb-6 text-2xl font-bold">Edit Site: {{ site?.name }}</h1>

        <SiteForm :initial-data="site" :loading="isLoading" @submit="save">
          <template #default="{ form }">
            <div class="flex gap-2 pt-4">
              <Button type="submit" variant="default">Save Changes</Button>
              <Button variant="ghost" as-child>
                <NuxtLink :to="`/admin/users/${form.userId}`">Cancel</NuxtLink>
              </Button>
            </div>
          </template>
        </SiteForm>
      </div>
    </div>
  </div>
</template>
