export interface CheckResultDataInterface {
  status: "up" | "down" | "degraded";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
}

const BODY_SCAN_LIMIT_BYTES = 256 * 1024;

async function readResponseTextLimited(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    return text.slice(0, maxBytes);
  }

  const decoder = new TextDecoder();
  let out = "";
  let received = 0;

  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (out.length >= maxBytes) {
      return out.slice(0, maxBytes);
    }
  }

  return out;
}

export async function checkSite(
  url: string,
  expectedText?: string | null,
  condition: string = "contains",
): Promise<CheckResultDataInterface> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Vigil-Monitor/1.0" },
    });

    const responseTime = Date.now() - startTime;

    let status: "up" | "down" | "degraded" = "up";
    if (response.status >= 500) {
      status = "down";
    } else if (response.status >= 400) {
      status = "degraded";
    }

    if (expectedText) {
      const text = await readResponseTextLimited(
        response,
        BODY_SCAN_LIMIT_BYTES,
      );

      const textExists = text.includes(expectedText);
      const conditionMet = condition === "contains" ? textExists : !textExists;
      if (!conditionMet) {
        status = "degraded";
        return {
          status,
          responseTime,
          statusCode: response.status,
          errorMessage: `Text condition failed: expected ${condition} "${expectedText}"`,
        };
      }
    }

    return { status, responseTime, statusCode: response.status };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error checking ${url}:`, msg);
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      errorMessage: msg,
    };
  }
}
