import prisma from "~~/lib/prisma";

interface AnomalyPoint {
  timestamp: string;
  responseTime: number;
  isAnomaly: boolean;
  zScore: number;
}

interface AnomalyResult {
  anomalies: AnomalyPoint[];
  anomalyCount: number;
  averageResponseTime: number;
  prediction: {
    nextHourRisk: number; // 0-1 probability
    trend: "improving" | "stable" | "degrading";
  };
}

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid site ID" });

  // Get last 7 days of data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = await prisma.check_results.findMany({
    where: {
      siteId: id,
      checked_at: { gte: sevenDaysAgo, not: null },
      responseTime: { not: null },
    },
    orderBy: { checked_at: "asc" },
    select: {
      responseTime: true,
      checked_at: true,
    },
  });

  // Filter out any remaining nulls (TypeScript safety)
  const validResults = results.filter(
    (r) => r.responseTime !== null && r.checked_at !== null,
  );

  if (validResults.length < 10) {
    return {
      anomalies: [],
      anomalyCount: 0,
      averageResponseTime: 0,
      prediction: { nextHourRisk: 0, trend: "stable" as const },
    };
  }

  // Calculate mean and standard deviation
  const responseTimes = validResults.map((r) => r.responseTime!);
  const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const variance =
    responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    responseTimes.length;
  const stdDev = Math.sqrt(variance);

  // Detect anomalies (Z-score > 2)
  const anomalies: AnomalyPoint[] = validResults.map((result) => {
    const zScore = stdDev > 0 ? (result.responseTime! - mean) / stdDev : 0;
    return {
      timestamp: result.checked_at!.toISOString(),
      responseTime: result.responseTime!,
      isAnomaly: Math.abs(zScore) > 2,
      zScore,
    };
  });

  const anomalyCount = anomalies.filter((a) => a.isAnomaly).length;

  // Simple trend analysis (last 24 hours vs previous)
  const last24h = validResults.filter(
    (r) => r.checked_at! > new Date(Date.now() - 24 * 60 * 60 * 1000),
  );
  const prev24h = validResults.filter(
    (r) =>
      r.checked_at! <= new Date(Date.now() - 24 * 60 * 60 * 1000) &&
      r.checked_at! > new Date(Date.now() - 48 * 60 * 60 * 1000),
  );

  const last24hAvg =
    last24h.length > 0
      ? last24h.reduce((a, b) => a + b.responseTime!, 0) / last24h.length
      : mean;
  const prev24hAvg =
    prev24h.length > 0
      ? prev24h.reduce((a, b) => a + b.responseTime!, 0) / prev24h.length
      : mean;

  let trend: "improving" | "stable" | "degrading" = "stable";
  if (last24hAvg < prev24hAvg * 0.95) trend = "improving";
  else if (last24hAvg > prev24hAvg * 1.05) trend = "degrading";

  // Risk prediction (simplified)
  const recentAnomalies = anomalies.filter(
    (a) =>
      a.isAnomaly &&
      new Date(a.timestamp) > new Date(Date.now() - 60 * 60 * 1000),
  );
  const nextHourRisk = Math.min(recentAnomalies.length * 0.2, 1); // 20% per anomaly, max 100%

  return {
    anomalies,
    anomalyCount,
    averageResponseTime: Math.round(mean),
    prediction: {
      nextHourRisk,
      trend,
    },
  } as AnomalyResult;
});
