import { useDB, dbRun, dbAll } from "~~/server/utils/db";
import { checkSite } from "~~/server/utils/httpChecker";
import { checkSSL } from "~~/server/utils/sslChecker";
import { checkSpeed } from "~~/server/utils/speedChecker";
import { takeScreenshot } from "~~/server/utils/screenshot";
import { broadcastCheckResult } from "~~/server/api/sse";
import { sendWebhook } from "~~/server/utils/webhook";

let isRunning = false;

export default defineNitroPlugin(() => {
  console.log(
    "monitoring running (check every minute, with 5 seconds delay on startup)",
  );

  const runUnifiedMonitor = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const db = useDB();

      // Get all active sites with user data
      const sites = await dbAll<any>(
        db,
        `SELECT s.*, u.webhook_url 
         FROM sites s
         LEFT JOIN users u ON s.userId = u.id
         WHERE s.isActive = 1`,
      );

      if (sites.length === 0) {
        console.log("Нет активных сайтов для мониторинга");
        isRunning = false;
        return;
      }

      for (const site of sites) {
        try {
          // 1. Main HTTP/Text check
          const httpResult = await checkSite(
            site.url,
            site.expected_text,
            site.text_condition || "contains",
          );

          // Get previous status for comparison
          const prevResults = await dbAll<any>(
            db,
            `SELECT status FROM check_results 
             WHERE siteId = ? 
             ORDER BY checked_at DESC LIMIT 1`,
            [site.id],
          );
          const prevStatus = prevResults[0]?.status;

          // Save result
          const savedHttp = await dbRun(
            db,
            `INSERT INTO check_results (siteId, status, responseTime, statusCode, errorMessage, checked_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`,
            [
              site.id,
              httpResult.status,
              httpResult.responseTime,
              httpResult.statusCode || null,
              httpResult.errorMessage || null,
            ],
          );

          // Get the full record for SSE
          const httpRecord = await dbAll<any>(
            db,
            `SELECT * FROM check_results WHERE id = ?`,
            [savedHttp.lastID],
          );

          // Send via SSE
          if (httpRecord[0]) {
            broadcastCheckResult({
              type: "http",
              ...httpRecord[0],
              siteName: site.name,
              siteUrl: site.url,
            });
          }

          // Notifications about downtime/recovery
          if (
            httpResult.status === "down" &&
            prevStatus !== "down" &&
            site.webhook_url
          ) {
            await sendWebhook(site.webhook_url, {
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
            site.webhook_url
          ) {
            await sendWebhook(site.webhook_url, {
              event: "up",
              site: { id: site.id, name: site.name, url: site.url },
              status: httpResult.status,
              responseTime: httpResult.responseTime,
              statusCode: httpResult.statusCode,
              timestamp: new Date().toISOString(),
            });
          }

          // 2. SSL check (every time, can be optimized to run less frequently if needed)
          try {
            const sslInfo = await checkSSL(site.url);

            const savedSSL = await dbRun(
              db,
              `INSERT INTO ssl_results 
               (siteId, valid, expired, daysLeft, validFrom, validTo, issuer, error, checked_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
              [
                site.id,
                sslInfo.valid ? 1 : 0,
                sslInfo.expired ? 1 : 0,
                sslInfo.daysLeft,
                sslInfo.validFrom.toISOString(),
                sslInfo.validTo.toISOString(),
                sslInfo.issuer || null,
                sslInfo.error || null,
              ],
            );

            const sslRecord = await dbAll<any>(
              db,
              `SELECT * FROM ssl_results WHERE id = ?`,
              [savedSSL.lastID],
            );

            if (sslRecord[0]) {
              broadcastCheckResult({
                type: "ssl",
                ...sslRecord[0],
                siteName: site.name,
                siteUrl: site.url,
              });
            }

            if (sslInfo.daysLeft <= 14 && site.webhook_url) {
              await sendWebhook(site.webhook_url, {
                event: "ssl_warning",
                site: { id: site.id, name: site.name, url: site.url },
                daysLeft: sslInfo.daysLeft,
                validTo: sslInfo.validTo,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error(`SSL error:`, error);
          }

          // 3. Speed check (every time, can be optimized to run less frequently if needed)
          try {
            const speedResult = await checkSpeed(site.url);

            const savedSpeed = await dbRun(
              db,
              `INSERT INTO speed_results (siteId, loadTime, ttfb, domContentLoaded, pageSize, requestCount, error, checked_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
              [
                site.id,
                speedResult.loadTime,
                speedResult.ttfb,
                speedResult.domContentLoaded,
                speedResult.pageSize,
                speedResult.requestCount,
                speedResult.error || null,
              ],
            );

            const speedRecord = await dbAll<any>(
              db,
              `SELECT * FROM speed_results WHERE id = ?`,
              [savedSpeed.lastID],
            );

            if (speedRecord[0]) {
              broadcastCheckResult({
                type: "speed",
                ...speedRecord[0],
                siteName: site.name,
                siteUrl: site.url,
              });
            }
          } catch (error) {
            console.error(`Speed error:`, error);
          }

          // 4. Screenshot (every time, can be optimized to run less frequently if needed)
          try {
            // Удаляем старый скриншот
            await dbRun(db, "DELETE FROM screenshots WHERE siteId = ?", [
              site.id,
            ]);

            const screenshotResult = await takeScreenshot(site.url, {
              viewportWidth: 1280,
              viewportHeight: 800,
              fullPage: true,
            });

            if (screenshotResult) {
              const savedScreenshot = await dbRun(
                db,
                `INSERT INTO screenshots (siteId, image_data, width, height, checked_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [
                  site.id,
                  screenshotResult.imageBuffer,
                  screenshotResult.width,
                  screenshotResult.height,
                ],
              );

              const screenshotRecord = await dbAll<any>(
                db,
                `SELECT id, siteId, width, height, checked_at FROM screenshots WHERE id = ?`,
                [savedScreenshot.lastID],
              );

              if (screenshotRecord[0]) {
                broadcastCheckResult({
                  type: "screenshot",
                  ...screenshotRecord[0],
                  siteName: site.name,
                  siteUrl: site.url,
                });
              }
            }
          } catch (error) {
            console.error(`Screenshot error:`, error);
          }
        } catch (error) {
          console.error(`Error processing site ${site.url}:`, error);
        }
      }

      // History cleanup (save the last N records for each site)
      console.log("Cleaning old records...");
      const retentionLimit = 20; // we can save the last N records for each site (can be configured)

      const allSites = await dbAll<any>(
        db,
        "SELECT id FROM sites WHERE isActive = 1",
      );

      for (const site of allSites) {
        // Cleanup check_results
        const rows = await dbAll<{ id: number }>(
          db,
          `SELECT id FROM check_results WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1 OFFSET ${retentionLimit - 1}`,
          [site.id],
        );
        if (rows[0]) {
          await dbRun(
            db,
            `DELETE FROM check_results WHERE siteId = ? AND id < ?`,
            [site.id, rows[0].id],
          );
        }

        // Cleanup speed_results
        const speedRows = await dbAll<{ id: number }>(
          db,
          `SELECT id FROM speed_results WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1 OFFSET ${retentionLimit - 1}`,
          [site.id],
        );
        if (speedRows[0]) {
          await dbRun(
            db,
            `DELETE FROM speed_results WHERE siteId = ? AND id < ?`,
            [site.id, speedRows[0].id],
          );
        }

        // Cleanup ssl_results
        const sslRows = await dbAll<{ id: number }>(
          db,
          `SELECT id FROM ssl_results WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1 OFFSET ${retentionLimit - 1}`,
          [site.id],
        );
        if (sslRows[0]) {
          await dbRun(
            db,
            `DELETE FROM ssl_results WHERE siteId = ? AND id < ?`,
            [site.id, sslRows[0].id],
          );
        }
      }
    } catch (error) {
      console.error("Error in monitoring:", error);
    } finally {
      isRunning = false;
    }
  };

  // Call the function immediately and then every minute
  setTimeout(runUnifiedMonitor, 5000);
  setInterval(runUnifiedMonitor, 60 * 1000);
});
