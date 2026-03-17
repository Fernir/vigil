import { useDB, dbRun, dbAll } from "../utils/db";
import { checkSite } from "../utils/httpChecker";
import { broadcastCheckResult } from "../api/sse";

let isRunning = false;

export default defineNitroPlugin(() => {
  console.log(
    "🚀 Мониторинг с индивидуальными интервалами запущен (проверка каждую минуту)",
  );

  const runMonitor = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const db = useDB();
      const sites = await dbAll<any>(
        db,
        `SELECT s.* 
            FROM sites s
            LEFT JOIN (
                SELECT siteId, MAX(checkedAt) as lastCheck
                FROM check_results
                GROUP BY siteId
            ) c ON s.id = c.siteId
            WHERE s.isActive = 1
            AND (c.lastCheck IS NULL OR datetime(c.lastCheck, '+' || s.checkInterval || ' minutes') <= datetime('now'))`,
      );

      if (sites.length === 0) {
        console.log("⏳ Нет сайтов для проверки в этом цикле");
        return;
      }

      for (const site of sites) {
        const result = await checkSite(
          site.url,
          site.expected_text,
          site.text_condition || "contains",
        );
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
        console.log(
          `  ${site.name} – ${result.status} (${result.responseTime}ms)`,
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
      }

      // Очистка истории...
    } catch (error) {
      console.error("❌ Ошибка мониторинга:", error);
    } finally {
      isRunning = false;
    }
  };

  setInterval(runMonitor, 60_000);

  runMonitor(); // Запускаем сразу при старте сервера
});
