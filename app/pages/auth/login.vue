<script setup lang="ts">
definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({
  title: "Sign In",
});

const router = useRouter();
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

  if (result.success) {
    // Даем время куке установиться
    setTimeout(() => navigateTo("/"));
  } else {
    error.value = result.error || "Login failed";
  }

  loading.value = false;
};
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      Sign in to your account
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error message -->
      <UAlert
        v-if="error"
        color="red"
        variant="soft"
        :title="error"
        icon="heroicons:exclamation-triangle-20-solid"
      />

      <!-- Email -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Email address
        </label>
        <UInput
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <!-- Password -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Password
        </label>
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      <!-- Submit button -->
      <UButton type="submit" color="primary" block :loading="loading">
        Sign in
      </UButton>

      <!-- Register link -->
      <p class="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?
        <NuxtLink
          to="/auth/register"
          class="text-primary-600 hover:text-primary-500 font-medium"
        >
          Sign up
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
