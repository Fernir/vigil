import { isWebhookUrlSafeForSend } from '~~/server/utils/safeWebhookUrl';

export async function sendWebhook(url: string, payload: unknown): Promise<boolean> {
  if (!isWebhookUrlSafeForSend(url)) {
    console.error('[webhook] skipped: URL failed SSRF safety checks');
    return false;
  }

  try {
    await $fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      timeout: 5000,
    });
    return true;
  } catch (error) {
    console.error('Failed to send webhook:', error);
    return false;
  }
}
