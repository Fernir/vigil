<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

useHead({ title: 'Settings' });

const { user } = useUserSession();

const webhookForm = reactive({
  url: user.value?.webhook_url || '',
});

const saving = ref(false);
const success = ref('');
const error = ref('');

const saveWebhookSettings = async () => {
  saving.value = true;
  success.value = '';
  error.value = '';

  try {
    await $fetch('/api/user', {
      method: 'PATCH',
      body: { webhook_url: webhookForm.url || null },
      credentials: 'include',
    });
    success.value = 'Webhook URL saved';
    if (user.value) {
      user.value.webhook_url = webhookForm.url;
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to save';
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <UButton to="/" variant="ghost" icon="heroicons:arrow-left"> Back </UButton>
      </div>
      <!-- Header -->
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div class="space-y-6">
        <!-- Webhook Section -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhook Notifications</h2>

          <UAlert v-if="success" color="green" variant="soft" :title="success" class="mb-4" />
          <UAlert v-if="error" color="red" variant="soft" :title="error" class="mb-4" />

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div class="flex items-start gap-3">
              <UIcon name="heroicons:link" class="w-5 h-5 text-blue-500 mt-0.5" />
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-medium mb-1">How to use webhooks:</p>
                <ol class="list-decimal list-inside space-y-1">
                  <li>Enter a URL that accepts POST requests with JSON payload.</li>
                  <li>You'll receive notifications when a site goes down or recovers.</li>

                  <li>
                    Example payload for Slack, Discord, etc. – see docs:
                    <a href="https://api.slack.com/messaging/webhooks" class="underline" target="_blank">slack</a>,
                    <a href="https://docs.discord.com/developers/resources/webhook" class="underline" target="_blank">discord</a>.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Webhook URL </label>
            <ClientOnly>
              <UInput v-model="webhookForm.url" placeholder="https://hooks.slack.com/services/..." />
              <template #fallback>
                <UInput disabled placeholder="Loading..." />
              </template>
            </ClientOnly>
          </div>

          <UButton color="primary" :loading="saving" @click="saveWebhookSettings" class="mt-4"> Save Webhook URL </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
