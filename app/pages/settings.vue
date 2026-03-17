<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Settings",
});

const { user, logout } = useUserSession();

const telegramForm = reactive({
  chatId: user.value?.telegramChatId || "",
});

const saving = ref(false);
const success = ref("");
const error = ref("");

const saveTelegramSettings = async () => {
  saving.value = true;
  success.value = "";
  error.value = "";

  try {
    // TODO: Save Telegram settings via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    success.value = "Settings saved successfully";
  } catch (e) {
    error.value = "Failed to save settings";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage your account and notification preferences
        </p>
      </div>

      <div class="space-y-6">
        <!-- Profile Section -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile
          </h2>

          <div class="space-y-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <UInput :model-value="user?.email" disabled class="bg-gray-50" />
            </div>
          </div>
        </div>

        <!-- Notifications Section -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notifications
          </h2>

          <!-- Success/Error messages -->
          <UAlert
            v-if="success"
            color="green"
            variant="soft"
            :title="success"
            class="mb-4"
            icon="heroicons:check-circle-20-solid"
          />

          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            class="mb-4"
            icon="heroicons:exclamation-triangle-20-solid"
          />

          <!-- Telegram Settings -->
          <div class="space-y-4">
            <h3 class="text-md font-medium text-gray-800 dark:text-gray-200">
              Telegram Notifications
            </h3>

            <div
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
            >
              <div class="flex items-start gap-3">
                <UIcon
                  name="simple-icons:telegram"
                  class="w-5 h-5 text-blue-500 mt-0.5"
                />
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <p class="font-medium mb-1">
                    How to get your Telegram Chat ID:
                  </p>
                  <ol class="list-decimal list-inside space-y-1">
                    <li>
                      Start a chat with
                      <a
                        href="https://t.me/userinfobot"
                        target="_blank"
                        class="underline"
                        >@userinfobot</a
                      >
                    </li>
                    <li>Send /start</li>
                    <li>Copy your Chat ID</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Telegram Chat ID
              </label>
              <UInput
                v-model="telegramForm.chatId"
                placeholder="Enter your Telegram Chat ID"
              />
            </div>

            <UButton
              color="primary"
              :loading="saving"
              @click="saveTelegramSettings"
            >
              Save Notification Settings
            </UButton>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card p-6 border border-red-200 dark:border-red-800">
          <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>

          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Once you logout, you'll need to sign in again to access your
              dashboard.
            </p>

            <UButton color="red" variant="soft" @click="logout">
              Sign Out
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
