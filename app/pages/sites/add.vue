<script setup lang="ts">
import type { SiteInterface } from "~~/types";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Site",
});

const router = useRouter();
const { addSite, loading } = useSites();

const form = reactive<
  Omit<
    SiteInterface,
    "id" | "userId" | "created_at" | "updated_at" | "isActive"
  >
>({
  name: "",
  url: "",
  check_type: "http",
  expected_text: "",
  text_condition: "contains",
  checkInterval: 30,
});

const errors = ref<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!form.name) newErrors.name = "Name is required";
  if (!form.url) newErrors.url = "URL is required";
  if (!form.url.match(/^https?:\/\/.+/)) {
    newErrors.url = "URL must start with http:// or https://";
  }
  if (form.check_type === "text" && !form.expected_text) {
    newErrors.expected_text = "Expected text is required for text check";
  }
  if (form.checkInterval < 30 || form.checkInterval > 3600) {
    newErrors.checkInterval = "Interval must be between 30 and 3600 seconds";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;

  const result = await addSite(form);
  if (result) {
    router.push("/");
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left">
          Back
        </UButton>
      </div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Add New Site
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Add a website or service to monitor
        </p>
      </div>

      <div class="card p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Site Name
            </label>
            <UInput
              v-model="form.name"
              placeholder="Site Name"
              :error="errors.name"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-error-600">
              {{ errors.name }}
            </p>
          </div>

          <!-- URL -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              URL
            </label>
            <UInput
              v-model="form.url"
              placeholder="https://example.com"
              :error="errors.url"
            />
            <p v-if="errors.url" class="mt-1 text-sm text-error-600">
              {{ errors.url }}
            </p>
          </div>

          <!-- Check Interval -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Check Interval (seconds)
            </label>
            <UInput
              v-model="form.checkInterval"
              type="number"
              min="30"
              max="3600"
              :error="errors.checkInterval"
            />
            <p v-if="errors.checkInterval" class="mt-1 text-sm text-error-600">
              {{ errors.checkInterval }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              How often to check this site (30-3600 seconds)
            </p>
          </div>

          <!-- Type of check -->
          <div>
            <label class="block text-sm font-medium mb-2">Check Type</label>
            <USelect
              v-model="form.check_type"
              :options="[
                { label: 'HTTP Status', value: 'http' },
                { label: 'Text on page', value: 'text' },
              ]"
            />
          </div>

          <!-- Field for text (appears if text is selected) -->
          <div v-if="form.check_type === 'text'">
            <label class="block text-sm font-medium mb-2">Expected Text</label>
            <UInput
              v-model="form.expected_text"
              placeholder="e.g. Welcome"
              :error="errors.expected_text"
            />
            <p v-if="errors.expected_text" class="mt-1 text-sm text-error-600">
              {{ errors.expected_text }}
            </p>
            <div class="mt-2">
              <label class="inline-flex items-center">
                <URadio v-model="form.text_condition" value="contains" />
                <span class="ml-2">Page must contain this text</span>
              </label>
              <label class="inline-flex items-center ml-4">
                <URadio v-model="form.text_condition" value="not_contains" />
                <span class="ml-2">Page must NOT contain this text</span>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <UButton type="submit" color="primary" :loading="loading">
              Add Site
            </UButton>
            <UButton color="gray" variant="ghost" to="/"> Cancel </UButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
