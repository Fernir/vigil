<script setup lang="ts">
definePageMeta({ middleware: "admin" });

const route = useRoute();
const router = useRouter();
const siteId = Number(route.params.id);
const toast = useToast();

const { data: site, refresh } = await useFetch(`/api/admin/sites/${siteId}`);

const form = reactive({
  name: "",
  url: "",
  checkInterval: 5,
  isActive: true,
  check_type: "http",
  expected_text: "",
  text_condition: "contains",
  userId: 0,
});

const errors = ref<Record<string, string>>({});

watchEffect(() => {
  if (site.value) {
    form.name = site.value.name;
    form.url = site.value.url;
    form.checkInterval = site.value.checkInterval;
    form.isActive = !!site.value.isActive;
    form.check_type = site.value.check_type || "http";
    form.expected_text = site.value.expected_text || "";
    form.text_condition = site.value.text_condition || "contains";
    form.userId = site.value.userId;
  }
});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!form.name) newErrors.name = "Name is required";
  if (!form.url) newErrors.url = "URL is required";
  else if (!form.url.match(/^https?:\/\/.+/)) {
    newErrors.url = "URL must start with http:// or https://";
  }
  if (form.checkInterval < 1 || form.checkInterval > 60) {
    newErrors.checkInterval = "Interval must be between 1 and 60 minutes";
  }
  if (form.check_type === "text" && !form.expected_text) {
    newErrors.expected_text = "Expected text is required for text check";
  }
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const save = async () => {
  if (!validate()) return;
  try {
    await $fetch(`/api/admin/sites/${siteId}`, {
      method: "PATCH",
      body: form,
    });
    toast.add({ title: "Site updated", color: "green" });
    await router.push(`/admin/users/${form.userId}`);
  } catch (e) {
    toast.add({ title: "Failed to update site", color: "red" });
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton
          :to="`/admin/users/${form.userId}`"
          variant="ghost"
          icon="heroicons:arrow-left"
        >
          Back
        </UButton>
      </div>

      <div class="card p-6">
        <h1 class="text-2xl font-bold mb-6">Edit Site: {{ site?.name }}</h1>

        <form @submit.prevent="save" class="space-y-4">
          <UInput
            v-model="form.name"
            placeholder="Site name"
            :error="errors.name"
          />
          <UInput
            v-model="form.url"
            placeholder="https://..."
            :error="errors.url"
          />
          <UInput
            v-model.number="form.checkInterval"
            type="number"
            min="1"
            max="60"
            placeholder="Interval (min)"
            :error="errors.checkInterval"
          />

          <div class="flex items-center gap-2">
            <UToggle v-model="form.isActive" />
            <span>Active monitoring</span>
          </div>

          <div>
            <USelect
              v-model="form.check_type"
              :options="[
                { label: 'HTTP Status', value: 'http' },
                { label: 'Text on page', value: 'text' },
              ]"
            />
          </div>

          <div v-if="form.check_type === 'text'" class="space-y-2">
            <UInput
              v-model="form.expected_text"
              placeholder="Expected text"
              :error="errors.expected_text"
            />
            <div class="flex gap-3 text-sm">
              <label class="flex items-center gap-1">
                <URadio v-model="form.text_condition" value="contains" />
                <span>contains</span>
              </label>
              <label class="flex items-center gap-1">
                <URadio v-model="form.text_condition" value="not_contains" />
                <span>not contains</span>
              </label>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <UButton type="submit" color="primary">Save Changes</UButton>
            <UButton
              color="gray"
              variant="ghost"
              :to="`/admin/users/${form.userId}`"
              >Cancel</UButton
            >
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
