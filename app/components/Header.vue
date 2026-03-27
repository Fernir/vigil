<script setup lang="ts">
const { loggedIn, logout, user } = useUserSession();

const userMenuItems = [
  [
    {
      label: 'Settings',
      icon: 'heroicons:cog-20-solid',
      to: '/settings',
    },
  ],
  [
    {
      label: 'Sign Out',
      icon: 'heroicons:arrow-left-on-rectangle-20-solid',
      click: () => logout(),
    },
  ],
];
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between">
      <div class="flex justify-between items-center h-16 w-full">
        <!-- Logo (always leads to the main page) -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.svg" alt="Vigil" class="h-8 w-auto" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">Vigil</span>
        </NuxtLink>

        <!-- Right side: theme + sign in/sign out buttons -->
        <div class="flex items-center gap-2">
          <UTooltip text="Account">
            <UButton v-if="!loggedIn" color="primary" variant="solid" to="/auth/login"> Sign In </UButton>

            <UDropdown v-else :items="userMenuItems">
              <UButton color="gray" variant="ghost" icon="heroicons:user-circle-20-solid">Profile</UButton>
            </UDropdown>
          </UTooltip>

          <template v-if="loggedIn && user?.is_admin">
            <UTooltip text="Admin Dashboard">
              <UButton color="gray" variant="ghost" to="/admin" icon="heroicons:shield-check-20-solid">Admin</UButton>
            </UTooltip>
          </template>
        </div>
      </div>
      <ThemeToggle />
    </div>
  </header>
</template>
