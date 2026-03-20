<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

useHead({ title: "Admin Dashboard" });

const { data: users, refresh } = await useFetch("/api/admin/users");

// Состояние сортировки для UTable
const sort = ref({
  column: "id",
  direction: "asc",
});

// Колонки таблицы
const columns = [
  { key: "id", label: "ID", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "max_sites", label: "Max Sites", sortable: true },
  {
    key: "banned_at",
    label: "Banned",
    sortable: true,
    // Кастомная сортировка для булевых значений через колонку banned_at
    sortFn: (rowA: any, rowB: any) => {
      const a = rowA.banned_at ? 1 : 0;
      const b = rowB.banned_at ? 1 : 0;
      return a - b;
    },
  },
  {
    key: "is_admin",
    label: "Admin",
    sortable: true,
    sortFn: (rowA: any, rowB: any) => {
      const a = rowA.is_admin ? 1 : 0;
      const b = rowB.is_admin ? 1 : 0;
      return a - b;
    },
  },
  { key: "actions", label: "Actions", sortable: false },
];
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left">
          Back
        </UButton>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Admin Dashboard
      </h1>

      <div class="card p-6">
        <h2 class="text-xl font-semibold mb-4">Users</h2>
        <UTable
          :rows="users || []"
          :columns="columns"
          v-model:sort="sort"
          class="w-full"
        >
          <!-- Кастомный рендеринг для колонки banned -->
          <template #banned_at-data="{ row }">
            <span v-if="row.banned_at" class="text-red-600">Yes</span>
            <span v-else class="text-green-600">No</span>
          </template>

          <!-- Кастомный рендеринг для колонки admin -->
          <template #is_admin-data="{ row }">
            <span v-if="row.is_admin" class="text-green-600">Yes</span>
            <span v-else>No</span>
          </template>

          <!-- Кастомный рендеринг для действий -->
          <template #actions-data="{ row }">
            <UButton
              color="gray"
              variant="ghost"
              icon="heroicons:pencil-square-20-solid"
              :to="`/admin/users/${row.id}`"
              size="xs"
            />
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>
