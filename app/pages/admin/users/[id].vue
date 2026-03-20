<script setup lang="ts">
import type { UserInterface, SiteInterface } from "~~/types";

definePageMeta({ middleware: "admin" });

const route = useRoute();
const userId = Number(route.params.id);
const toast = useToast();

// Загружаем данные пользователя и его сайты
const { data: user, refresh: refreshUser } = await useFetch<UserInterface>(
  `/api/admin/users/${userId}`,
);
const { data: sites, refresh: refreshSites } = await useFetch<SiteInterface[]>(
  `/api/admin/users/${userId}/sites`,
);

const form = reactive({
  max_sites: user.value?.max_sites || 4,
  is_admin: user.value?.is_admin || false,
  banned_at: user.value?.banned_at || null,
});

const saving = ref(false);
const showAddSiteModal = ref(false);
const newSiteForm = reactive({
  name: "",
  url: "",
  checkInterval: 5,
  check_type: "http",
  expected_text: "",
  text_condition: "contains",
});

const save = async () => {
  saving.value = true;
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: form,
    });
    toast.add({ title: "User updated", color: "green" });
    await refreshUser();
  } catch (e) {
    toast.add({ title: "Failed to update user", color: "red" });
  } finally {
    saving.value = false;
  }
};

const ban = () => {
  form.banned_at = new Date();
};

const unban = () => {
  form.banned_at = null;
};

const deleteSite = async (siteId: number) => {
  if (!confirm("Are you sure you want to delete this site?")) return;
  try {
    await $fetch(`/api/admin/sites/${siteId}`, { method: "DELETE" });
    toast.add({ title: "Site deleted", color: "green" });
    await refreshSites();
  } catch (e) {
    toast.add({ title: "Failed to delete site", color: "red" });
  }
};

const addSite = async () => {
  try {
    await $fetch("/api/admin/sites", {
      method: "POST",
      body: {
        ...newSiteForm,
        userId,
      },
    });
    toast.add({ title: "Site added", color: "green" });
    showAddSiteModal.value = false;
    await refreshSites();
    // Сброс формы
    Object.assign(newSiteForm, {
      name: "",
      url: "",
      checkInterval: 5,
      check_type: "http",
      expected_text: "",
      text_condition: "contains",
    });
  } catch (e) {
    toast.add({ title: "Failed to add site", color: "red" });
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/admin" variant="ghost" icon="heroicons:arrow-left">
          Back
        </UButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая колонка: информация о пользователе -->
        <div class="lg:col-span-1">
          <div class="card p-6">
            <h1 class="text-2xl font-bold mb-6">
              Edit User: {{ user?.email }}
            </h1>

            <form @submit.prevent="save" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Max Sites</label>
                <UInput
                  v-model.number="form.max_sites"
                  type="number"
                  min="1"
                  max="100"
                />
              </div>

              <div class="flex items-center gap-2">
                <UToggle
                  :model-value="!!form.is_admin"
                  @update:model-value="form.is_admin = $event"
                />
                <span>Is Admin</span>
              </div>

              <div class="flex gap-2">
                <UButton
                  v-if="!form.banned_at"
                  color="red"
                  variant="soft"
                  @click="ban"
                  >Ban User</UButton
                >
                <UButton v-else color="green" variant="soft" @click="unban"
                  >Unban User</UButton
                >
              </div>

              <div class="flex gap-2 pt-4">
                <UButton type="submit" color="primary" :loading="saving"
                  >Save Changes</UButton
                >
              </div>
            </form>
          </div>
        </div>

        <!-- Правая колонка: сайты пользователя -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">User Sites</h2>
              <UButton
                color="primary"
                icon="heroicons:plus-20-solid"
                @click="showAddSiteModal = true"
              >
                Add Site
              </UButton>
            </div>

            <div v-if="!sites?.length" class="text-center py-8 text-gray-500">
              No sites for this user
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="site in sites"
                :key="site.id"
                class="border dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-semibold">{{ site.name }}</h3>
                    <a
                      :href="site.url"
                      target="_blank"
                      class="text-sm text-gray-500 hover:text-primary-600"
                      >{{ site.url }}</a
                    >
                    <div class="flex gap-2 mt-2 text-xs">
                      <span
                        class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                        >Interval: {{ site.checkInterval }}m</span
                      >
                      <span
                        class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                        >Type: {{ site.check_type }}</span
                      >
                      <span
                        :class="
                          site.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        "
                        class="px-2 py-1 rounded"
                      >
                        {{ site.isActive ? "Active" : "Paused" }}
                      </span>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <UButton
                      color="gray"
                      variant="ghost"
                      icon="heroicons:pencil-square-20-solid"
                      :to="`/admin/sites/${site.id}`"
                      size="xs"
                    />
                    <UButton
                      color="red"
                      variant="ghost"
                      icon="heroicons:trash-20-solid"
                      @click="deleteSite(site.id)"
                      size="xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Модалка добавления сайта -->
      <UModal v-model="showAddSiteModal">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            Add Site for {{ user?.email }}
          </h3>
          <form @submit.prevent="addSite" class="space-y-4">
            <UInput v-model="newSiteForm.name" placeholder="Site name" />
            <UInput v-model="newSiteForm.url" placeholder="https://..." />
            <UInput
              v-model.number="newSiteForm.checkInterval"
              type="number"
              min="30"
              max="3600"
              placeholder="Check interval (seconds)"
            />

            <div>
              <USelect
                v-model="newSiteForm.check_type"
                :options="[
                  { label: 'HTTP Status', value: 'http' },
                  { label: 'Text on page', value: 'text' },
                ]"
              />
            </div>

            <div v-if="newSiteForm.check_type === 'text'" class="space-y-2">
              <UInput
                v-model="newSiteForm.expected_text"
                placeholder="Expected text"
              />
              <div class="flex gap-3 text-sm">
                <label class="flex items-center gap-1">
                  <URadio
                    v-model="newSiteForm.text_condition"
                    value="contains"
                  />
                  <span>contains</span>
                </label>
                <label class="flex items-center gap-1">
                  <URadio
                    v-model="newSiteForm.text_condition"
                    value="not_contains"
                  />
                  <span>not contains</span>
                </label>
              </div>
            </div>

            <div class="flex gap-2 pt-4">
              <UButton type="submit" color="primary">Add Site</UButton>
              <UButton
                color="gray"
                variant="ghost"
                @click="showAddSiteModal = false"
                >Cancel</UButton
              >
            </div>
          </form>
        </div>
      </UModal>
    </div>
  </div>
</template>
