// server/plugins/ssl-monitoring.ts
import { useDB, dbRun, dbAll } from "../utils/db";
import { checkSSL } from "../utils/sslChecker";

export default defineNitroPlugin(() => {
  // Запускаем только в production или по расписанию
  if (!process.dev) return;

  console.log("🔒 SSL-мониторинг запущен (проверка раз в 24 часа)");

  const runSSLMonitor = async () => {
    const db = useDB();
    const sites = await dbAll<any>(
      db,
      "SELECT id, url FROM sites WHERE isActive = 1",
    );

    for (const site of sites) {
      try {
        const sslInfo = await checkSSL(site.url);

        await dbRun(
          db,
          `INSERT INTO ssl_results 
           (siteId, valid, expired, daysLeft, validFrom, validTo, issuer, error, checkedAt)
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

        // Уведомление, если осталось мало дней
        if (sslInfo.daysLeft <= 14) {
          await sendNotification({
            type: "ssl",
            site: site.url,
            daysLeft: sslInfo.daysLeft,
          });
        }
      } catch (error) {
        console.error(`SSL check failed for ${site.url}:`, error);
      }
    }
  };

  // Запускаем сразу и затем раз в 24 часа
  setTimeout(runSSLMonitor, 5000);
  setInterval(runSSLMonitor, 24 * 60 * 60 * 1000);
});
