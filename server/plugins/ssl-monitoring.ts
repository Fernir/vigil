import { useDB, dbRun, dbAll } from "../utils/db";
import { checkSSL } from "../utils/sslChecker";

export default defineNitroPlugin(() => {
  // Call only in production or on schedule, not during development to avoid unnecessary checks and logs
  if (!process.dev) return;

  console.log("SSL-мониторинг запущен (проверка раз в 24 часа)");

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
      } catch (error) {
        console.error(`SSL check failed for ${site.url}:`, error);
      }
    }
  };

  // Call immediately and then every 24 hours
  setTimeout(runSSLMonitor, 5000);
  setInterval(runSSLMonitor, 24 * 60 * 60 * 1000);
});
