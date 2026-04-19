<script setup lang="ts">
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import type { UserInterface, SiteInterface } from "~~/types";

definePageMeta({ middleware: "admin" });

const route = useRoute();
const { ask } = useConfirm();

const userId = Number(route.params.id);

const isLoading = ref(true);

const { data: user, refresh: refreshUser } = await useFetch<UserInterface>(`/api/admin/users/${userId}`);
const { data: sites, refresh: refreshSites } = await useFetch<SiteInterface[]>(`/api/admin/users/${userId}/sites`);

isLoading.value = false;

const form = reactive({
  max_sites: user.value?.max_sites || 4,
  is_admin: user.value?.is_admin || false,
  banned_at: user.value?.banned_at || null,
});

const showAddSiteModal = ref(false);

const save = async () => {
  isLoading.value = true;
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: form,
    });
    toast.success("User updated");
    await refreshUser();
  } catch (e) {
    toast.error("Failed to update user");
  } finally {
    isLoading.value = false;
  }
};

const ban = () => {
  form.banned_at = new Date();
};

const unban = () => {
  form.banned_at = null;
};

const deleteSite = async (siteId: number) => {
  const confirmed = await ask({
    title: "Delete site?",
    description: "Are you sure you want to delete this site? This action cannot be undone.",
  });

  if (!confirmed) return;

  isLoading.value = true;
  try {
    await $fetch(`/api/admin/sites/${siteId}`, { method: "DELETE" });
    toast.success("Site deleted");
    await refreshSites();
  } catch (e) {
    toast.error("Failed to delete site");
  } finally {
    isLoading.value = false;
  }
};

const addSite = async (newSiteForm: SiteInterface) => {
  isLoading.value = true;
  try {
    await $fetch("/api/admin/sites", {
      method: "POST",
      body: {
        ...newSiteForm,
        userId,
      },
    });
    toast.success("Site added");
    showAddSiteModal.value = false;
    await refreshSites();
  } catch (e) {
    toast.error("Failed to add site");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-background py-8">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <Button variant="ghost" class="gap-2" as-child>
          <NuxtLink to="/admin">
            <ArrowLeft class="size-4" />
            Back
          </NuxtLink>
        </Button>
      </div>

      <div class="stacked gap-6">
        <div class="lg:col-span-1">
          <div class="card p-6">
            <h1 class="mb-6 text-2xl font-bold">Edit User: {{ user?.email }}</h1>

            <form class="space-y-4" @submit.prevent="save">
              <div>
                <Label class="mb-2 block text-sm font-medium" for="max-sites">Max Sites</Label>
                <Input id="max-sites" v-model.number="form.max_sites" type="number" min="1" max="100" placeholder="Max Sites" />
              </div>

              <div class="flex items-center gap-2">
                <Switch id="is-admin" :checked="!!form.is_admin" @update:checked="(v: boolean) => (form.is_admin = v)" />
                <Label for="is-admin">Is Admin</Label>
              </div>

              <div class="flex gap-2">
                <Button v-if="!form.banned_at" variant="destructive" type="button" @click="ban">
                  Ban User
                </Button>
                <Button v-else variant="secondary" type="button" @click="unban">Unban User</Button>
              </div>

              <div class="flex gap-2 pt-4">
                <Button type="submit" variant="default" :disabled="isLoading">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="card p-6">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-xl font-semibold">User Sites</h2>
              <Button variant="default" class="gap-2" @click="showAddSiteModal = true">
                <Plus class="size-4" />
                Add Site
              </Button>
            </div>

            <div v-if="!sites?.length" class="py-8 text-center text-muted-foreground">No sites for this user</div>

            <div v-else class="space-y-4">
              <div v-for="site in sites" :key="site.id" class="rounded-lg border border-border p-4">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-semibold">{{ site.name }}</h3>
                    <a
                      :href="site.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-foreground underline decoration-border underline-offset-4 hover:text-muted-foreground"
                      >{{ site.url }}</a
                    >
                    <div class="mt-2 flex flex-wrap gap-2 text-xs">
                      <span class="meta-pill meta-pill-muted">Interval: {{ site.checkInterval }}m</span>
                      <span class="meta-pill meta-pill-muted">Type: {{ site.check_type }}</span>
                      <span
                        :class="site.isActive ? 'meta-pill meta-pill-active' : 'meta-pill meta-pill-paused'"
                      >
                        {{ site.isActive ? "Active" : "Paused" }}
                      </span>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" as-child>
                      <NuxtLink :to="`/admin/sites/${site.id}`">
                        <Pencil class="size-3.5" />
                      </NuxtLink>
                    </Button>
                    <Button variant="ghost" size="icon" @click="deleteSite(site.id)">
                      <Trash2 class="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog v-model:open="showAddSiteModal">
        <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Site for {{ user?.email }}</DialogTitle>
          </DialogHeader>
          <SiteForm class="space-y-4" :loading="isLoading" @submit="addSite">
            <div class="flex gap-2 pt-4">
              <Button type="submit" variant="default">Add Site</Button>
              <Button variant="ghost" type="button" @click="showAddSiteModal = false"> Cancel </Button>
            </div>
          </SiteForm>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
