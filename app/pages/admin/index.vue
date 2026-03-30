<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
});

useHead({ title: 'Admin Dashboard' });

const { data: users } = await useFetch('/api/admin/users');

// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'max_sites', label: 'Max Sites', sortable: true },
  {
    key: 'banned_at',
    label: 'Banned',
    sortable: true,
  },
  {
    key: 'is_admin',
    label: 'Admin',
    sortable: true,
  },
  { key: 'actions', label: 'Actions', sortable: false },
];
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left"> Back </UButton>
      </div>
      <div class="card p-6">
        <h2 class="text-xl font-semibold mb-4">Users</h2>

        <UTable :rows="users" :columns="columns">
          <template #banned_at-data="{ row }">
            <UBadge :color="row.banned_at ? 'red' : 'green'" variant="soft">
              {{ row.banned_at ? 'Yes' : 'No' }}
            </UBadge>
          </template>
          <template #is_admin-data="{ row }">
            <UBadge :color="row.is_admin ? 'green' : 'red'" variant="soft">
              {{ row.is_admin ? 'Yes' : 'No' }}
            </UBadge>
          </template>
          <template #actions-data="{ row }">
            <UButton color="gray" variant="ghost" data-test="Edit User" icon="heroicons:pencil-square-20-solid" :to="`/admin/users/${row.id}`" size="xs" />
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>
