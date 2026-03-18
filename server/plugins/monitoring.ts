import { useDB, dbRun, dbAll } from "../utils/db";
import { checkSite } from "../utils/httpChecker";
import { broadcastCheckResult } from "../api/sse";
import { sendWebhook } from "../utils/webhook";

let isRunning = false;

export default defineNitroPlugin(() => {
  console.log(
    "Мониторинг с индивидуальными интервалами запущен (проверка каждую минуту)",
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
                SELECT siteId, MAX(checkedAt) as lastCheck
                FROM check_results
                GROUP BY siteId
            ) c ON s.id = c.siteId
            WHERE s.isActive = 1
            AND (c.lastCheck IS NULL OR datetime(c.lastCheck, '+' || s.checkInterval || ' minutes') <= datetime('now'))`,
      );

      if (sites.length === 0) {
        console.log("Нет сайтов для проверки в этом цикле");
        return;
      }

      for (const site of sites) {
        const result = await checkSite(
          site.url,
          site.expected_text,
          site.text_condition || "contains",
        );

        // Получаем последний статус для сайта (предыдущий)
        const lastResult = await dbAll<any>(
          db,
          `SELECT status FROM check_results 
           WHERE siteId = ? 
           ORDER BY checkedAt DESC LIMIT 1`,
          [site.id],
        );
        const prevStatus = lastResult[0]?.status;

        // Сохраняем новый результат
        const savedResult = await dbRun(
          db,
          `INSERT INTO check_results (siteId, status, responseTime, statusCode, errorMessage, checkedAt) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [
            site.id,
            result.status,
            result.responseTime,
            result.statusCode || null,
            result.errorMessage || null,
          ],
        );

        // Получаем полную запись для отправки через SSE
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

        // Уведомление о падении (используем prevStatus)
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

        // Уведомление о восстановлении
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

      // Очистка истории (последние 50 записей для каждого сайта)
      const allSites = await dbAll<any>(
        db,
        `SELECT id FROM sites WHERE isActive = 1`,
      );
      for (const site of allSites) {
        const rows = await dbAll<{ id: number }>(
          db,
          `SELECT id FROM check_results WHERE siteId = ? ORDER BY checkedAt DESC LIMIT 1 OFFSET 49`,
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

      console.log("Цикл мониторинга завершён");
    } catch (error) {
      console.error("Ошибка мониторинга:", error);
    } finally {
      isRunning = false;
    }
  };

  // Запускаем раз в минуту
  setInterval(runMonitor, 60_000);
  // Запускаем сразу при старте
  runMonitor();
});
