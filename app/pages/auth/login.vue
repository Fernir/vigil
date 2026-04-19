<script setup lang="ts">
import { Loader2, TriangleAlert } from "lucide-vue-next";

definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({
  title: "Sign In",
});

const { login } = useUserSession();

const form = reactive({
  email: "",
  password: "",
});

const loading = ref(false);
const error = ref("");

const handleSubmit = async () => {
  loading.value = true;
  error.value = "";

  const result = await login(form.email, form.password);

  if (result?.success) {
    setTimeout(() => navigateTo("/"));
  } else {
    error.value = "Login failed";
  }

  loading.value = false;
};
</script>

<template>
  <div>
    <h2 class="mb-6 text-2xl font-bold text-foreground">Sign in to your account</h2>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="destructive" data-test="error">
        <TriangleAlert class="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div>
        <Label class="mb-2 block text-sm font-medium" for="email">Email address</Label>
        <Input id="email" v-model="form.email" type="email" placeholder="you@example.com" required />
      </div>

      <div>
        <Label class="mb-2 block text-sm font-medium" for="password">Password</Label>
        <Input id="password" v-model="form.password" type="password" placeholder="••••••••" required />
      </div>

      <Button type="submit" class="w-full" :disabled="loading">
        <Loader2 v-if="loading" class="mr-2 size-4 animate-spin" />
        Sign in
      </Button>

      <p class="text-center text-sm text-muted-foreground">
        Don't have an account?
        <NuxtLink
          to="/auth/register"
          class="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-muted-foreground"
        >
          Sign up
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
