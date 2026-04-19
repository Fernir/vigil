<script setup lang="ts">
import { ArrowLeft, Link2, Loader2 } from "lucide-vue-next";
import { FetchError } from "ofetch";

definePageMeta({
  middleware: "auth",
});

useHead({ title: "Settings" });

const { user } = useUserSession();

const webhookForm = reactive({
  url: user.value?.webhook_url || "",
});

const saving = ref(false);
const success = ref("");
const error = ref("");

const saveWebhookSettings = async () => {
  saving.value = true;
  success.value = "";
  error.value = "";

  try {
    await $fetch("/api/user", {
      method: "PATCH",
      body: { webhook_url: webhookForm.url || null },
      credentials: "include",
    });
    success.value = "Webhook URL saved";
    if (user.value) {
      user.value.webhook_url = webhookForm.url;
    }
  } catch (e: unknown) {
    error.value = e instanceof FetchError ? e.data?.message : "Failed to save";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-background py-8">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div class="mb-4">
        <Button variant="ghost" class="gap-2" as-child>
          <NuxtLink to="/">
            <ArrowLeft class="size-4" />
            Back
          </NuxtLink>
        </Button>
      </div>
      <h1 class="mb-8 text-3xl font-bold text-foreground">Settings</h1>

      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="mb-4 text-lg font-semibold text-foreground">Webhook Notifications</h2>

          <Alert v-if="success" class="mb-4 border-border bg-muted/60 text-foreground">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription class="text-muted-foreground">{{ success }}</AlertDescription>
          </Alert>
          <Alert v-if="error" variant="destructive" class="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <div class="mb-4 rounded-lg border border-border bg-muted/40 p-4">
            <div class="flex items-start gap-3">
              <Link2 class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div class="text-sm text-muted-foreground">
                <p class="mb-1 font-medium text-foreground">How to use webhooks:</p>
                <ol class="list-inside list-decimal space-y-1">
                  <li>Enter a URL that accepts POST requests with JSON payload.</li>
                  <li>You'll receive notifications when a site goes down or recovers.</li>

                  <li>
                    Example payload for Slack, Discord, etc. – see docs:
                    <a
                      href="https://api.slack.com/messaging/webhooks"
                      class="text-foreground underline decoration-border underline-offset-4 hover:text-muted-foreground"
                      target="_blank"
                      rel="noopener noreferrer"
                      >slack</a
                    >,
                    <a
                      href="https://docs.discord.com/developers/resources/webhook"
                      class="text-foreground underline decoration-border underline-offset-4 hover:text-muted-foreground"
                      target="_blank"
                      rel="noopener noreferrer"
                      >discord</a
                    >.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <Label class="mb-2 block text-sm font-medium" for="webhook-url">Webhook URL</Label>
            <ClientOnly>
              <Input id="webhook-url" v-model="webhookForm.url" placeholder="https://hooks.slack.com/services/..." />
              <template #fallback>
                <Input disabled placeholder="Loading..." />
              </template>
            </ClientOnly>
          </div>

          <Button variant="default" class="mt-4" :disabled="saving" @click="saveWebhookSettings">
            <Loader2 v-if="saving" class="mr-2 size-4 animate-spin" />
            Save Webhook URL
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
