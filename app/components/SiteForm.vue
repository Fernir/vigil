<script setup lang="ts">
import type { SiteInterface } from "~~/types";

const props = defineProps<{
  initialData?: Partial<SiteInterface> | null;
  loading?: boolean;
}>();

const emit = defineEmits(["submit", "cancel"]);

const form = reactive({
  name: "",
  url: "",
  userId: 0,
  isActive: true,
  expected_text: "",
  checkInterval: 30,
  check_type: "http",
  text_condition: "contains",
});

const errors = ref<Record<string, string>>({});

watchEffect(() => {
  if (props.initialData) {
    Object.assign(form, {
      ...props.initialData,
      checkInterval: props.initialData.checkInterval ?? 30,
      isActive: props.initialData.isActive !== false,
      userId: props.initialData.userId ?? 0,
    });
  }
});

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.match(/^https?:\/\//i)) return trimmed;
  return trimmed.includes(".") ? `https://${trimmed}` : trimmed;
};

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!form.name) newErrors.name = "Name is required";
  if (!form.url) {
    newErrors.url = "URL is required";
  } else if (!form.url.match(/^https?:\/\/.+/)) {
    newErrors.url = "URL must start with http:// or https://";
  }

  const interval = Number(form.checkInterval);
  if (isNaN(interval) || interval < 30 || interval > 300) {
    newErrors.checkInterval = "Must be between 30-300 sec";
  }

  if (form.check_type === "text" && !form.expected_text) {
    newErrors.expected_text = "Required for text check";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  form.url = normalizeUrl(form.url);
  if (validate()) {
    emit("submit", { ...form });
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <fieldset :disabled="loading" class="space-y-4">
      <div class="space-y-2">
        <Label for="site-name">Name</Label>
        <Input id="site-name" v-model="form.name" placeholder="Site name" />
        <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
      </div>

      <div class="space-y-2">
        <Label for="site-url">URL</Label>
        <Input
          id="site-url"
          v-model="form.url"
          placeholder="example.com"
          @blur="form.url = normalizeUrl(form.url)"
        />
        <p v-if="errors.url" class="text-sm text-destructive">{{ errors.url }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="site-interval">Interval (sec)</Label>
          <Input id="site-interval" v-model.number="form.checkInterval" type="number" />
          <p v-if="errors.checkInterval" class="text-sm text-destructive">{{ errors.checkInterval }}</p>
        </div>

        <div class="space-y-2">
          <Label for="site-check-type">Check Type</Label>
          <Select v-model="form.check_type">
            <SelectTrigger id="site-check-type" class="w-full">
              <SelectValue placeholder="Check type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http">HTTP Status</SelectItem>
              <SelectItem value="text">Text on page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex items-center gap-2 py-2">
        <Switch id="site-active" v-model="form.isActive" />
        <Label for="site-active" class="cursor-pointer font-normal">Active monitoring</Label>
      </div>

      <div v-if="form.check_type === 'text'" class="space-y-4 rounded-lg bg-muted/50 p-4">
        <div class="space-y-2">
          <Label for="expected-text">Expected Text</Label>
          <Input id="expected-text" v-model="form.expected_text" placeholder="What text to look for?" />
          <p v-if="errors.expected_text" class="text-sm text-destructive">
            {{ errors.expected_text }}
          </p>
        </div>

        <RadioGroup v-model="form.text_condition" class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <RadioGroupItem id="tc-contains" value="contains" />
            <Label for="tc-contains" class="cursor-pointer font-normal">Contains</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem id="tc-not" value="not_contains" />
            <Label for="tc-not" class="cursor-pointer font-normal">Not contains</Label>
          </div>
        </RadioGroup>
      </div>

      <slot :form="form" />
    </fieldset>
  </form>
</template>
