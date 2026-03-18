export interface CheckResultData {
  status: "up" | "down" | "degraded";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
}

export async function checkSite(
  url: string,
  expectedText?: string | null,
  condition: "contains" | "not_contains" = "contains",
): Promise<CheckResultData> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Vigil-Monitor/1.0" },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Base check for HTTP status
    let status: "up" | "down" | "degraded" = "up";
    if (response.status >= 500) {
      status = "down";
    } else if (response.status >= 400) {
      status = "degraded";
    }

    // If expected text is specified, check for it in the response body
    if (expectedText) {
      const text = await response.text();

      const textExists = text.includes(expectedText);
      if (
        (condition === "contains" && !textExists) ||
        (condition === "not_contains" && textExists)
      ) {
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
  } catch (error: any) {
    console.error(`Error checking ${url}:`, error.message);
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      errorMessage: error.message,
    };
  }
}
