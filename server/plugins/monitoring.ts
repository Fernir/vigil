import prisma from '~~/lib/prisma';
import { checkSite } from '~~/server/utils/httpChecker';
import { checkSSL } from '~~/server/utils/sslChecker';
import { checkSiteUnified } from '~~/server/utils/domRenderChecks';
import { broadcastCheckResult } from '~~/server/api/sse';
import { sendWebhook } from '~~/server/utils/webhook';
import crypto from 'node:crypto';

let isRunning = false;
export const RETENTION_LIMIT = 20;

export default defineNitroPlugin(() => {
  const runUnifiedMonitor = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const sites = await prisma.sites.findMany({
        where: { isActive: true },
        include: {
          users: {
            select: { webhook_url: true },
          },
        },
      });

      if (sites.length === 0) {
        isRunning = false;
        return;
      }

      for (const site of sites) {
        try {
          const httpResult = await checkSite(site.url, site.expected_text, site.text_condition ?? 'contains');

          const prevResult = await prisma.check_results.findFirst({
            where: { siteId: site.id },
            orderBy: { checked_at: 'desc' },
          });
          const prevStatus = prevResult?.status;

          const httpRecord = await prisma.check_results.create({
            data: {
              siteId: site.id,
              status: httpResult.status,
              responseTime: httpResult.responseTime,
              statusCode: httpResult.statusCode,
              errorMessage: httpResult.errorMessage,
              checked_at: new Date(),
            },
          });

          broadcastCheckResult({
            type: 'http',
            ...httpRecord,
            siteName: site.name,
            siteUrl: site.url,
          });

          // AI Anomaly Detection
          try {
            const recentResults = await prisma.check_results.findMany({
              where: { siteId: site.id },
              orderBy: { checked_at: 'desc' },
              take: 100, // Last 100 checks for analysis
              select: { responseTime: true },
            });

            if (recentResults.length >= 10) {
              const responseTimes = recentResults.map((r) => r.responseTime ?? 0);
              const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
              const variance = responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responseTimes.length;
              const stdDev = Math.sqrt(variance);

              const zScore = stdDev > 0 ? (httpResult.responseTime - mean) / stdDev : 0;
              const isAnomaly = Math.abs(zScore) > 2;

              if (isAnomaly) {
                broadcastCheckResult({
                  type: 'anomaly',
                  siteId: site.id,
                  responseTime: httpResult.responseTime,
                  zScore,
                  mean,
                  stdDev,
                  checked_at: httpRecord.checked_at,
                  siteName: site.name,
                  siteUrl: site.url,
                });
              }
            }
          } catch (error) {
            // Silent fail for anomaly detection
          }

          if (httpResult.status === 'down' && prevStatus !== 'down' && site.users?.webhook_url) {
            await sendWebhook(site.users.webhook_url, {
              event: 'down',
              site: { id: site.id, name: site.name, url: site.url },
              status: httpResult.status,
              responseTime: httpResult.responseTime,
              statusCode: httpResult.statusCode,
              error: httpResult.errorMessage,
              timestamp: new Date().toISOString(),
            });
          }

          if ((httpResult.status === 'up' || httpResult.status === 'degraded') && prevStatus === 'down' && site.users?.webhook_url) {
            await sendWebhook(site.users.webhook_url, {
              event: 'up',
              site: { id: site.id, name: site.name, url: site.url },
              status: httpResult.status,
              responseTime: httpResult.responseTime,
              statusCode: httpResult.statusCode,
              timestamp: new Date().toISOString(),
            });
          }

          // 2. SSL check
          try {
            const sslInfo = await checkSSL(site.url);

            const sslRecord = await prisma.ssl_results.create({
              data: {
                siteId: site.id,
                valid: sslInfo.valid,
                expired: sslInfo.expired,
                daysLeft: sslInfo.daysLeft,
                validFrom: sslInfo.validFrom,
                validTo: sslInfo.validTo,
                issuer: sslInfo.issuer,
                error: sslInfo.error,
                checked_at: new Date(),
              },
            });

            broadcastCheckResult({
              type: 'ssl',
              ...sslRecord,
              siteName: site.name,
              siteUrl: site.url,
            });

            if (sslInfo.daysLeft <= 14 && site.users?.webhook_url) {
              await sendWebhook(site.users.webhook_url, {
                event: 'ssl_warning',
                site: { id: site.id, name: site.name, url: site.url },
                daysLeft: sslInfo.daysLeft,
                validTo: sslInfo.validTo,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {}

          // 3. Unified browser check (speed + screenshot)
          try {
            const unifiedResult = await checkSiteUnified(site.url, {
              viewportWidth: 1280,
              viewportHeight: 800,
              fullPage: true,
              timeout: 30000,
            });

            if (unifiedResult && !unifiedResult.error) {
              const speedRecord = await prisma.speed_results.create({
                data: {
                  siteId: site.id,
                  loadTime: unifiedResult.loadTime,
                  ttfb: unifiedResult.ttfb,
                  domContentLoaded: unifiedResult.domContentLoaded,
                  pageSize: unifiedResult.pageSize,
                  requestCount: unifiedResult.requestCount,
                  checked_at: new Date(),
                },
              });

              broadcastCheckResult({
                type: 'speed',
                ...speedRecord,
                siteName: site.name,
                siteUrl: site.url,
              });

              await prisma.screenshots.deleteMany({
                where: { siteId: site.id },
              });

              const screenshotRecord = await prisma.screenshots.create({
                data: {
                  siteId: site.id,
                  image_data: unifiedResult.screenshotBuffer,
                  width: unifiedResult.width,
                  height: unifiedResult.height,
                  checked_at: new Date(),
                },
              });

              broadcastCheckResult({
                type: 'screenshot',
                id: screenshotRecord.id,
                siteId: screenshotRecord.siteId,
                width: screenshotRecord.width,
                height: screenshotRecord.height,
                checked_at: screenshotRecord.checked_at,
                hash: crypto
                  .createHash('md5')
                  .update(screenshotRecord.image_data?.toString('base64') ?? '')
                  .digest('hex'),
                siteName: site.name,
                siteUrl: site.url,
              });
            } else {
            }
          } catch (error) {}
        } catch (error) {
          console.error(`Error processing site ${site.url}:`, error);
        }
      }

      // Cleanup old records

      const allSites = await prisma.sites.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      for (const site of allSites) {
        const row = await prisma.check_results.findFirst({
          where: { siteId: site.id },
          orderBy: { checked_at: 'desc' },
          skip: RETENTION_LIMIT - 1,
          take: 1,
          select: { id: true },
        });

        if (row) {
          await prisma.check_results.deleteMany({
            where: {
              siteId: site.id,
              id: { lt: row.id },
            },
          });
        }

        const speedRow = await prisma.speed_results.findFirst({
          where: { siteId: site.id },
          orderBy: { checked_at: 'desc' },
          skip: RETENTION_LIMIT - 1,
          take: 1,
          select: { id: true },
        });

        if (speedRow) {
          await prisma.speed_results.deleteMany({
            where: {
              siteId: site.id,
              id: { lt: speedRow.id },
            },
          });
        }

        const sslRow = await prisma.ssl_results.findFirst({
          where: { siteId: site.id },
          orderBy: { checked_at: 'desc' },
          skip: RETENTION_LIMIT - 1,
          take: 1,
          select: { id: true },
        });

        if (sslRow) {
          await prisma.ssl_results.deleteMany({
            where: {
              siteId: site.id,
              id: { lt: sslRow.id },
            },
          });
        }
      }
    } finally {
      isRunning = false;
    }
  };

  setTimeout(runUnifiedMonitor, 5_000);
  setInterval(runUnifiedMonitor, 30_000);
});
