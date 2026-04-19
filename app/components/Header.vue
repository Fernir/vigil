<script setup lang="ts">
import { ShieldCheck, UserCircle } from 'lucide-vue-next';

const { loggedIn, logout, user } = useUserSession();
</script>

<template>
  <header class="border-b border-border bg-card">
    <div class="mx-auto flex max-w-7xl justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 w-full items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <NuxtImg src="/logo.svg" alt="Vigil" class="h-8 w-auto" />
          <span class="text-xl font-bold text-foreground">Vigil</span>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <template v-if="!loggedIn">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="default" as-child>
                  <NuxtLink to="/auth/login">Sign In</NuxtLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Account</TooltipContent>
            </Tooltip>
          </template>

          <DropdownMenu v-else>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="gap-2">
                <UserCircle class="size-4" />
                Profile
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings" class="cursor-pointer"> Settings </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="logout()"> Sign Out </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <template v-if="loggedIn && user?.is_admin">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" class="gap-2" as-child>
                  <NuxtLink to="/admin">
                    <ShieldCheck class="size-4" />
                    Admin
                  </NuxtLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Admin Dashboard</TooltipContent>
            </Tooltip>
          </template>

          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>
</template>
