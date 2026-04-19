<script setup lang="ts">
import { Loader2, TriangleAlert } from "lucide-vue-next";

definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({
  title: "Sign Up",
});

const { register } = useUserSession();

const form = reactive({
  email: "",
  password: "",
  confirmPassword: "",
});

const loading = ref(false);
const error = ref("");

const handleSubmit = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }

  if (form.password.length < 6) {
    error.value = "Password must be at least 6 characters";
    return;
  }

  loading.value = true;
  error.value = "";

  const result = await register(form.email, form.password);

  if (!result.success) {
    error.value = result.error || "Registration failed";
  }

  loading.value = false;
};
</script>

<template>
  <div>
    <h2 class="mb-6 text-2xl font-bold text-foreground">Create an account</h2>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <Alert v-if="error" variant="destructive">
        <TriangleAlert class="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div>
        <Label class="mb-2 block text-sm font-medium" for="reg-email">Email address</Label>
        <Input id="reg-email" v-model="form.email" type="email" placeholder="you@example.com" required />
      </div>

      <div>
        <Label class="mb-2 block text-sm font-medium" for="reg-password">Password</Label>
        <Input id="reg-password" v-model="form.password" type="password" placeholder="••••••••" required />
        <p class="mt-1 text-xs text-muted-foreground">At least 6 characters</p>
      </div>

      <div>
        <Label class="mb-2 block text-sm font-medium" for="reg-confirm">Confirm Password</Label>
        <Input id="reg-confirm" v-model="form.confirmPassword" type="password" placeholder="••••••••" required />
      </div>

      <Button type="submit" class="w-full" :disabled="loading">
        <Loader2 v-if="loading" class="mr-2 size-4 animate-spin" />
        Sign up
      </Button>

      <p class="text-center text-sm text-muted-foreground">
        Already have an account?
        <NuxtLink
          to="/auth/login"
          class="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-muted-foreground"
        >
          Sign in
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
