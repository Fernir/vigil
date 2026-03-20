export async function sendWebhook(url: string, payload: any): Promise<boolean> {
  try {
    await $fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      timeout: 5000,
    });
    return true;
  } catch (error) {
    console.error("Failed to send webhook:", error);
    return false;
  }
}
