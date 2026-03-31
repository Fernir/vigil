<script setup lang="ts">
import type { SiteInterface } from '~~/types';

// Принимаем начальные данные и состояние загрузки
const props = defineProps<{
  modelValue: Partial<SiteInterface>;
  loading?: boolean;
  title?: string;
}>();

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

// Локальные ошибки
const errors = ref<Record<string, string>>({});

const normalizeUrl = (url: string): string => {
  if (!url) return url;

  let normalizedUrl = url.trim();

  if (normalizedUrl.match(/^https?:\/\//i)) {
    return normalizedUrl;
  }

  return `https://${normalizedUrl}`;
};

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!props.modelValue.name) newErrors.name = 'Name is required';
  if (!props.modelValue.url) newErrors.url = 'URL is required';
  else if (!props.modelValue.url.match(/^https?:\/\/.+/)) {
    newErrors.url = 'URL must start with http:// or https://';
  }
  if (Number(props.modelValue.checkInterval) < 1 || Number(props.modelValue.checkInterval) > 60) {
    newErrors.checkInterval = 'Interval must be between 1 and 60 minutes';
  }
  if (props.modelValue.check_type === 'text' && !props.modelValue.expected_text) {
    newErrors.expected_text = 'Expected text is required for text check';
  }
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  if (validate()) {
    emit('submit');
  }
};
</script>

<template>
  <h1 v-if="title" class="text-2xl font-bold mb-6">{{ title }}</h1>

  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UFormGroup label="Name" :error="errors.name">
      <UInput v-model="props.modelValue.name" placeholder="Site name" />
    </UFormGroup>

    <UFormGroup label="URL" :error="errors.url">
      <UInput v-model="props.modelValue.url" placeholder="https://example.com" @blur="props.modelValue.url = normalizeUrl(props.modelValue.url || '')" />
    </UFormGroup>

    <UFormGroup label="Interval (min)" :error="errors.checkInterval">
      <UInput v-model.number="props.modelValue.checkInterval" type="number" />
    </UFormGroup>

    <div class="flex items-center gap-2">
      <UToggle v-model="props.modelValue.isActive" />
      <span>Active monitoring</span>
    </div>

    <USelect
      v-model="props.modelValue.check_type"
      :options="[
        { label: 'HTTP Status', value: 'http' },
        { label: 'Text on page', value: 'text' },
      ]"
    />

    <div v-if="props.modelValue.check_type === 'text'" class="space-y-2">
      <UInput v-model="props.modelValue.expected_text" placeholder="Expected text" :error="errors.expected_text" />
      <div class="flex gap-3 text-sm">
        <URadio v-model="props.modelValue.text_condition" value="contains" label="contains" />
        <URadio v-model="props.modelValue.text_condition" value="not_contains" label="not contains" />
      </div>
    </div>

    <slot />
  </form>
</template>
