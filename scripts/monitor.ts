import { useDB, dbRun, dbAll } from "../server/utils/db";
import { checkSite, type CheckResultData } from "../server/utils/httpChecker";
import { broadcastCheckResult } from "../server/api/sse";

async function runMonitor() {
  const db = useDB();

  try {
    // Получаем все активные сайты
    const sites = await dbAll<any>(
      db,
      "SELECT * FROM sites WHERE isActive = 1",
    );

    for (const site of sites) {
      try {
        const resultData: CheckResultData = await checkSite(site.url);

        // Сохраняем результат
        const savedResult = await dbRun(
          db,
          `INSERT INTO check_results (siteId, status, responseTime, statusCode, errorMessage, checkedAt) 
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [
            site.id,
            resultData.status,
            resultData.responseTime,
            resultData.statusCode || null,
            resultData.errorMessage || null,
          ],
        );

        // Получаем полные данные результата для отправки
        const newResults = await dbAll<any>(
          db,
          "SELECT * FROM check_results WHERE id = ?",
          [savedResult.lastID],
        );

        // Отправляем через SSE всем подключенным клиентам
        if (newResults[0]) {
          broadcastCheckResult({
            ...newResults[0],
            siteName: site.name,
            siteUrl: site.url,
          });
        }

        // Проверяем нужно ли отправить уведомление (если статус изменился на down)
        if (resultData.status === "down") {
          const previousResults = await dbAll<any>(
            db,
            "SELECT status FROM check_results WHERE siteId = ? AND id != ? ORDER BY checkedAt DESC LIMIT 1",
            [site.id, savedResult.lastID],
          );

          const lastResult = previousResults[0];
          if (lastResult && lastResult.status !== "down") {
            console.log(`🔴 ALERT: Site ${site.name} is DOWN!`);
            // TODO: Отправить уведомление в Telegram
          }
        }
      } catch (error) {
        console.error(`❌ Error checking ${site.url}:`, error);
      }
    }
  } catch (error) {
    console.error("💥 Monitoring failed:", error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Запускаем мониторинг
runMonitor();
