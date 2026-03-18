import { useDB, dbRun, dbAll } from "../utils/db";
import { checkSite } from "../utils/httpChecker";
import { broadcastCheckResult } from "../api/sse";
import { sendWebhook } from "../utils/webhook";

let isRunning = false;

export default defineNitroPlugin(() => {
  console.log(
    "Monitoring with individual intervals started (checking every minute)",
  );

  const runMonitor = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const db = useDB();
      const sites = await dbAll<any>(
        db,
        `SELECT s.*, u.webhook_url 
            FROM sites s
            LEFT JOIN users u ON s.userId = u.id
            LEFT JOIN (
                SELECT siteId, MAX(checked_at) as lastCheck
                FROM check_results
                GROUP BY siteId
            ) c ON s.id = c.siteId
            WHERE s.isActive = 1
            AND (c.lastCheck IS NULL OR datetime(c.lastCheck, '+' || s.checkInterval || ' minutes') <= datetime('now'))`,
      );

      if (sites.length === 0) {
        console.log("No sites to check at this time");
        return;
      }

      for (const site of sites) {
        const result = await checkSite(
          site.url,
          site.expected_text,
          site.text_condition || "contains",
        );

        // Get the last status for the site (previous check)
        const lastResult = await dbAll<any>(
          db,
          `SELECT status FROM check_results 
           WHERE siteId = ? 
           ORDER BY checked_at DESC LIMIT 1`,
          [site.id],
        );
        const prevStatus = lastResult[0]?.status;

        // Save the new result in the database
        const savedResult = await dbRun(
          db,
          `INSERT INTO check_results (siteId, status, responseTime, statusCode, errorMessage, checked_at) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [
            site.id,
            result.status,
            result.responseTime,
            result.statusCode || null,
            result.errorMessage || null,
          ],
        );

        // Get the full record for sending via SSE
        const newRows = await dbAll<any>(
          db,
          `SELECT * FROM check_results WHERE id = ?`,
          [savedResult.lastID],
        );
        if (newRows.length > 0) {
          broadcastCheckResult({
            ...newRows[0],
            siteName: site.name,
            siteUrl: site.url,
          });
        }

        // Notification about downtime (using prevStatus)
        if (
          result.status === "down" &&
          prevStatus !== "down" &&
          site.webhook_url
        ) {
          const payload = {
            event: "down",
            site: {
              id: site.id,
              name: site.name,
              url: site.url,
            },
            status: result.status,
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            error: result.errorMessage,
            timestamp: new Date().toISOString(),
          };

          await sendWebhook(site.webhook_url, payload);
        }

        // Notification about recovery
        if (
          (result.status === "up" || result.status === "degraded") &&
          prevStatus === "down" &&
          site.webhook_url
        ) {
          const payload = {
            event: "up",
            site: {
              id: site.id,
              name: site.name,
              url: site.url,
            },
            status: result.status,
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            timestamp: new Date().toISOString(),
          };
          await sendWebhook(site.webhook_url, payload);
        }
      }

      // Clear history (last 50 records for each site)
      const allSites = await dbAll<any>(
        db,
        `SELECT id FROM sites WHERE isActive = 1`,
      );
      for (const site of allSites) {
        const rows = await dbAll<{ id: number }>(
          db,
          `SELECT id FROM check_results WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1 OFFSET 49`,
          [site.id],
        );
        const row = rows[0];
        if (row) {
          await dbRun(
            db,
            `DELETE FROM check_results WHERE siteId = ? AND id < ?`,
            [site.id, row.id],
          );
        }
      }

      console.log("Monitoring cycle completed");
    } catch (error) {
      console.error("Monitoring error:", error);
    } finally {
      isRunning = false;
    }
  };

  // Start every minute
  setInterval(runMonitor, 60_000);
  // Start immediately on startup  setTimeout(runMonitor, 5000);
  runMonitor();
});
