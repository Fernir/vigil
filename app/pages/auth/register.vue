<script setup lang="ts">
definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({
  title: "Sign Up",
});

const router = useRouter();
const { register } = useUserSession();

const form = reactive({
  email: "",
  password: "",
  confirmPassword: "",
});

const loading = ref(false);
const error = ref("");
const success = ref(false);

const handleSubmit = async () => {
  // Валидация
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

  if (result.success) {
    success.value = true;
    // Перенаправляем на логин через 2 секунды
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  } else {
    error.value = result.error || "Registration failed";
  }

  loading.value = false;
};
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      Create an account
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Success message -->
      <UAlert
        v-if="success"
        color="green"
        variant="soft"
        title="Registration successful!"
        description="Redirecting to login page..."
        icon="heroicons:check-circle-20-solid"
      />

      <!-- Error message -->
      <UAlert
        v-if="error && !success"
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
          :disabled="success"
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
          :disabled="success"
        />
        <p class="mt-1 text-xs text-gray-500">At least 6 characters</p>
      </div>

      <!-- Confirm Password -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Confirm Password
        </label>
        <UInput
          v-model="form.confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          :disabled="success"
        />
      </div>

      <!-- Submit button -->
      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        :disabled="success"
      >
        Sign up
      </UButton>

      <!-- Login link -->
      <p class="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?
        <NuxtLink
          to="/auth/login"
          class="text-primary-600 hover:text-primary-500 font-medium"
        >
          Sign in
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
