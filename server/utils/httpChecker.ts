import { logger } from "./logger";

// Этот интерфейс только для результата проверки (без id и даты)
export interface CheckResultData {
  status: "up" | "down" | "degraded";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
}

export async function checkSite(url: string): Promise<CheckResultData> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Vigil-Monitor/1.0",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let status: "up" | "down" | "degraded" = "up";
    if (response.status >= 500) {
      status = "down";
    } else if (response.status >= 400) {
      status = "degraded";
    }

    return {
      status,
      responseTime,
      statusCode: response.status,
    };
  } catch (error: any) {
    logger.error(`Error checking ${url}:`, error.message);

    return {
      status: "down",
      responseTime: Date.now() - startTime,
      errorMessage: error.message,
    };
  }
}
