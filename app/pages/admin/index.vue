<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
});

useHead({ title: 'Admin Dashboard' });

const { data: users } = await useFetch('/api/admin/users');

// Sort state with proper types
const sort = ref<{ column: string; direction: 'asc' | 'desc' }>({
  column: 'id',
  direction: 'asc',
});

// Columns definition
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'max_sites', label: 'Max Sites', sortable: true },
  {
    key: 'banned_at',
    label: 'Banned',
    sortable: true,
    sortFn: (rowA: any, rowB: any) => {
      const a = rowA.banned_at ? 1 : 0;
      const b = rowB.banned_at ? 1 : 0;
      return a - b;
    },
  },
  {
    key: 'is_admin',
    label: 'Admin',
    sortable: true,
    sortFn: (rowA: any, rowB: any) => {
      const a = rowA.is_admin ? 1 : 0;
      const b = rowB.is_admin ? 1 : 0;
      return a - b;
    },
  },
  { key: 'actions', label: 'Actions', sortable: false },
];

// Helper to toggle sort
const toggleSort = (column: string) => {
  if (sort.value.column === column) {
    sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value.column = column;
    sort.value.direction = 'asc';
  }
};

const getSortIcon = (column: string) => {
  if (sort.value.column !== column) return 'heroicons:arrows-up-down-20-solid';
  return sort.value.direction === 'asc' ? 'heroicons:arrow-up-20-solid' : 'heroicons:arrow-down-20-solid';
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

      <div class="card p-6">
        <h2 class="text-xl font-semibold mb-4">Users</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th
                  v-for="col in columns.filter((c) => c.key !== 'actions')"
                  :key="col.key"
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  @click="col.sortable !== false ? toggleSort(col.key) : null"
                >
                  <div class="flex items-center gap-1">
                    {{ col.label }}
                    <UIcon v-if="col.sortable !== false" :name="getSortIcon(col.key)" class="w-4 h-4" />
                  </div>
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in users" :key="user.id">
                <td class="px-4 py-2">{{ user.id }}</td>
                <td class="px-4 py-2">{{ user.email }}</td>
                <td class="px-4 py-2">{{ user.max_sites }}</td>
                <td class="px-4 py-2">
                  <span v-if="user.banned_at" class="text-red-600">Yes</span>
                  <span v-else class="text-green-600">No</span>
                </td>
                <td class="px-4 py-2">
                  <span v-if="user.is_admin" class="text-green-600">Yes</span>
                  <span v-else>No</span>
                </td>
                <td class="px-4 py-2">
                  <UButton color="gray" variant="ghost" data-test="Edit User" icon="heroicons:pencil-square-20-solid" :to="`/admin/users/${user.id}`" size="xs" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
