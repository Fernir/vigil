<script setup lang="ts">
import { ArrowLeft, Pencil } from "lucide-vue-next";

definePageMeta({
  middleware: "admin",
});

useHead({ title: "Admin Dashboard" });

const { data: users } = await useFetch<
  Array<{
    id: number;
    email: string;
    max_sites: number | null;
    banned_at: string | null;
    is_admin: boolean | null;
  }>
>("/api/admin/users");
</script>

<template>
  <div class="min-h-screen bg-background py-8">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 class="mb-8 text-3xl font-bold text-foreground">Admin Dashboard</h1>
      <div class="mb-4">
        <Button variant="ghost" class="gap-2" as-child>
          <NuxtLink to="/">
            <ArrowLeft class="size-4" />
            Back
          </NuxtLink>
        </Button>
      </div>
      <div class="card p-6">
        <h2 class="mb-4 text-xl font-semibold">Users</h2>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Max Sites</TableHead>
                <TableHead>Banned</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in users || []" :key="row.id">
                <TableCell>{{ row.id }}</TableCell>
                <TableCell>{{ row.email }}</TableCell>
                <TableCell>{{ row.max_sites }}</TableCell>
                <TableCell>
                  <Badge :variant="row.banned_at ? 'destructive' : 'secondary'">
                    {{ row.banned_at ? "Yes" : "No" }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="row.is_admin ? 'default' : 'outline'">
                    {{ row.is_admin ? "Yes" : "No" }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button variant="ghost" size="icon" data-test="Edit User" as-child>
                    <NuxtLink :to="`/admin/users/${row.id}`">
                      <Pencil class="size-3.5" />
                    </NuxtLink>
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </div>
</template>
