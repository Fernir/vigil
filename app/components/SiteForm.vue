<script setup lang="ts">
import type { SiteInterface } from '~~/types';

const props = defineProps<{
  initialData?: Partial<SiteInterface> | null;
  loading?: boolean;
}>();

// Передаем данные обратно при сабмите
const emit = defineEmits(['submit', 'cancel']);

// Внутреннее реактивное состояние формы
const form = reactive({
  name: '',
  url: '',
  userId: 0,
  isActive: true,
  expected_text: '',
  checkInterval: 30,
  check_type: 'http',
  text_condition: 'contains',
});

// Ошибки валидации
const errors = ref<Record<string, string>>({});

// Синхронизируем внутреннюю форму с входящими данными (например, после useFetch)
watchEffect(() => {
  if (props.initialData) {
    Object.assign(form, {
      ...props.initialData,
      // Гарантируем дефолтные значения для корректной работы UI
      checkInterval: props.initialData.checkInterval ?? 30,
      isActive: props.initialData.isActive !== false, // дефолт true, если не пришло false
      userId: props.initialData.userId ?? 0,
    });
  }
});

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.match(/^https?:\/\//i)) return trimmed;
  return trimmed.includes('.') ? `https://${trimmed}` : trimmed;
};

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!form.name) newErrors.name = 'Name is required';
  if (!form.url) {
    newErrors.url = 'URL is required';
  } else if (!form.url.match(/^https?:\/\/.+/)) {
    newErrors.url = 'URL must start with http:// or https://';
  }

  const interval = Number(form.checkInterval);
  if (isNaN(interval) || interval < 30 || interval > 300) {
    newErrors.checkInterval = 'Must be between 30-300 sec';
  }

  if (form.check_type === 'text' && !form.expected_text) {
    newErrors.expected_text = 'Required for text check';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  form.url = normalizeUrl(form.url);
  if (validate()) {
    // Отправляем копию состояния формы родителю
    emit('submit', { ...form });
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <fieldset :disabled="loading" class="space-y-4">
      <UFormGroup label="Name" :error="errors.name">
        <UInput v-model="form.name" placeholder="Site name" />
      </UFormGroup>

      <UFormGroup label="URL" :error="errors.url">
        <UInput v-model="form.url" placeholder="example.com" @blur="form.url = normalizeUrl(form.url)" />
      </UFormGroup>

      <div class="grid grid-cols-2 gap-4">
        <UFormGroup label="Interval (sec)" :error="errors.checkInterval">
          <UInput v-model.number="form.checkInterval" type="number" />
        </UFormGroup>

        <UFormGroup label="Check Type">
          <USelect
            v-model="form.check_type"
            :options="[
              { label: 'HTTP Status', value: 'http' },
              { label: 'Text on page', value: 'text' },
            ]"
          />
        </UFormGroup>
      </div>

      <div class="flex items-center gap-2 py-2">
        <UToggle v-model="form.isActive" />
        <span class="text-sm">Active monitoring</span>
      </div>

      <div v-if="form.check_type === 'text'" class="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UFormGroup label="Expected Text" :error="errors.expected_text">
          <UInput v-model="form.expected_text" placeholder="What text to look for?" />
        </UFormGroup>

        <div class="flex gap-4">
          <URadio v-model="form.text_condition" value="contains" label="Contains" />
          <URadio v-model="form.text_condition" value="not_contains" label="Not contains" />
        </div>
      </div>

      <!-- Передаем текущий стейт формы в слот, чтобы родитель видел userId -->
      <slot :form="form" />
    </fieldset>
  </form>
</template>
