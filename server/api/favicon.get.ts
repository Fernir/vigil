import { assertSafeFetchHostname } from "~~/server/utils/safeWebhookUrl";

const MAX_BYTES = 500_000;
const MIN_BYTES = 32;
const TIMEOUT_MS = 6_000;

function guessImageContentType(buf: Buffer): string {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    return "image/jpeg";
  }
  if (buf.length >= 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return "image/gif";
  }
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    return "image/x-icon";
  }
  if (buf.length >= 2 && buf[0] === 0x3c && buf[1] === 0x3f) {
    return "image/svg+xml";
  }
  return "application/octet-stream";
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const host = typeof q.host === "string" ? q.host : typeof q.domain === "string" ? q.domain : "";
  if (!host?.trim()) {
    throw createError({ statusCode: 400, message: "Missing host" });
  }

  assertSafeFetchHostname(host);

  const h = new URL(`https://${host.trim()}`).hostname;
  const candidates = [
    `https://${h}/favicon.ico`,
    `https://${h}/favicon.png`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Vigil-Favicon/1.0" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "follow",
      });

      if (!res.ok) continue;

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < MIN_BYTES || buf.length > MAX_BYTES) continue;

      const probe = buf.slice(0, 96).toString("latin1").trimStart().toLowerCase();
      if (probe.startsWith("<!doctype") || probe.startsWith("<html")) {
        continue;
      }

      const hdr = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
      const allowed =
        !hdr ||
        hdr.startsWith("image/") ||
        hdr === "application/octet-stream" ||
        hdr === "binary/octet-stream";

      if (!allowed) continue;

      const ct =
        hdr && hdr.startsWith("image/")
          ? hdr
          : guessImageContentType(buf);

      setHeader(event, "Content-Type", ct);
      setHeader(event, "Cache-Control", "public, max-age=86400");
      return buf;
    } catch {}
  }

  throw createError({ statusCode: 404, message: "No favicon" });
});
