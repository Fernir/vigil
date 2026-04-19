import { createError } from "h3";

function validateWebhookUrlCore(urlString: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return "Invalid webhook URL";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Webhook URL must use http or https";
  }

  const host = parsed.hostname.toLowerCase();

  const blockedExact = new Set([
    "localhost",
    "0.0.0.0",
    "::1",
    "127.0.0.1",
    "metadata.google.internal",
    "metadata.goog",
  ]);

  if (blockedExact.has(host)) {
    return "Webhook URL host is not allowed";
  }

  if (host.endsWith(".localhost") || host.endsWith(".local")) {
    return "Webhook URL host is not allowed";
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const o = ipv4.slice(1, 5).map((x) => Number(x));
    if (o.some((n) => n > 255)) {
      return "Invalid webhook URL";
    }
    const a = o[0]!;
    const b = o[1]!;
    if (
      a === 10 ||
      a === 0 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a >= 224 && a <= 239)
    ) {
      return "Webhook URL must not point to a private or reserved address";
    }
  }

  return null;
}

export function assertSafeWebhookUrl(urlString: string): void {
  const err = validateWebhookUrlCore(urlString);
  if (err) {
    throw createError({ statusCode: 400, message: err });
  }
}

export function isWebhookUrlSafeForSend(urlString: string): boolean {
  return validateWebhookUrlCore(urlString) === null;
}

export function assertSafeFetchHostname(hostname: string): void {
  const raw = hostname.trim();
  if (!raw) {
    throw createError({ statusCode: 400, message: "Invalid host" });
  }

  let canonicalHost: string;
  try {
    canonicalHost = new URL(`https://${raw}`).hostname.toLowerCase();
  } catch {
    throw createError({ statusCode: 400, message: "Invalid host" });
  }

  const err = validateWebhookUrlCore(`https://${canonicalHost}/`);
  if (err) {
    throw createError({ statusCode: 400, message: "Host is not allowed" });
  }
}
