import prisma from "~~/lib/prisma";
import { checkSite } from "~~/server/utils/httpChecker";
import { checkSSL } from "~~/server/utils/sslChecker";
import { checkSiteUnified } from "~~/server/utils/puppeeterChecks";
import { broadcastCheckResult } from "~~/server/api/sse";
import { sendWebhook } from "~~/server/utils/webhook";

let isRunning = false;
const RETENTION_LIMIT = 20;

export default defineNitroPlugin(() => {
  console.log("[Monitoring] Unified monitor started (check every minute)");

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
        console.log("[Monitoring] No active sites to monitor");
        isRunning = false;
        return;
      }

      for (const site of sites) {
        console.log(`[Monitoring] Checking ${site.name} (${site.url})...`);

        try {
          const httpResult = await checkSite(
            site.url,
            site.expected_text,
            site.text_condition || "contains",
          );

          const prevResult = await prisma.check_results.findFirst({
            where: { siteId: site.id },
            orderBy: { checked_at: "desc" },
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

          console.log(
            `  HTTP: ${httpResult.status} (${httpResult.responseTime}ms)`,
          );

          broadcastCheckResult({
            type: "http",
            ...httpRecord,
            siteName: site.name,
            siteUrl: site.url,
          });

          if (
            httpResult.status === "down" &&
            prevStatus !== "down" &&
            site.users?.webhook_url
          ) {
            await sendWebhook(site.users.webhook_url, {
              event: "down",
              site: { id: site.id, name: site.name, url: site.url },
              status: httpResult.status,
              responseTime: httpResult.responseTime,
              statusCode: httpResult.statusCode,
              error: httpResult.errorMessage,
              timestamp: new Date().toISOString(),
            });
          }

          if (
            (httpResult.status === "up" || httpResult.status === "degraded") &&
            prevStatus === "down" &&
            site.users?.webhook_url
          ) {
            await sendWebhook(site.users.webhook_url, {
              event: "up",
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
              type: "ssl",
              ...sslRecord,
              siteName: site.name,
              siteUrl: site.url,
            });

            if (sslInfo.daysLeft <= 14 && site.users?.webhook_url) {
              await sendWebhook(site.users.webhook_url, {
                event: "ssl_warning",
                site: { id: site.id, name: site.name, url: site.url },
                daysLeft: sslInfo.daysLeft,
                validTo: sslInfo.validTo,
                timestamp: new Date().toISOString(),
              });
            }

            console.log(`  SSL: ${sslInfo.daysLeft} days left`);
          } catch (error) {
            console.error(`  SSL error:`, error);
          }

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
                type: "speed",
                ...speedRecord,
                siteName: site.name,
                siteUrl: site.url,
              });

              console.log(
                `  Speed: ${unifiedResult.loadTime}ms, Size: ${unifiedResult.pageSize}KB`,
              );

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
                type: "screenshot",
                id: screenshotRecord.id,
                siteId: screenshotRecord.siteId,
                width: screenshotRecord.width,
                height: screenshotRecord.height,
                checked_at: screenshotRecord.checked_at,
                siteName: site.name,
                siteUrl: site.url,
              });

              console.log(
                `  Screenshot: ${unifiedResult.width}x${unifiedResult.height}`,
              );
            } else {
              console.log(
                `  Unified check failed: ${unifiedResult?.error || "Unknown error"}`,
              );
            }
          } catch (error) {
            console.error(`  Unified check error:`, error);
          }
        } catch (error) {
          console.error(`Error processing site ${site.url}:`, error);
        }
      }

      // Cleanup old records
      console.log("[Monitoring] Cleaning old records...");

      const allSites = await prisma.sites.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      for (const site of allSites) {
        const row = await prisma.check_results.findFirst({
          where: { siteId: site.id },
          orderBy: { checked_at: "desc" },
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
          orderBy: { checked_at: "desc" },
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
          orderBy: { checked_at: "desc" },
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

      console.log("[Monitoring] Unified monitoring cycle completed");
    } catch (error) {
      console.error("[Monitoring] Error in unified monitor:", error);
    } finally {
      isRunning = false;
    }
  };

  setTimeout(runUnifiedMonitor, 5_000);
  setInterval(runUnifiedMonitor, 30_000);
});
