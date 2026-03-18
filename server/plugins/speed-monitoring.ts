import { useDB, dbRun, dbAll } from "../utils/db";
import { checkSpeed } from "../utils/speedChecker";

export default defineNitroPlugin(() => {
  if (!process.dev) return;
  console.log("Speed monitoring запущен (проверка раз в 6 часов)");

  const runSpeedCheck = async () => {
    const db = useDB();
    const sites = await dbAll<any>(
      db,
      "SELECT id, url FROM sites WHERE isActive = 1",
    );
    for (const site of sites) {
      try {
        const result = await checkSpeed(site.url);
        await dbRun(
          db,
          `INSERT INTO speed_results (siteId, loadTime, ttfb, domContentLoaded, pageSize, requestCount, error, checkedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            site.id,
            result.loadTime,
            result.ttfb,
            result.domContentLoaded,
            result.pageSize,
            result.requestCount,
            result.error || null,
          ],
        );
        console.log(`Speed check for ${site.url}: ${result}`);
      } catch (e) {
        console.error(`Speed check failed for ${site.url}:`, e);
      }
    }
  };

  // First run after 10 seconds, then every 6 hours
  setTimeout(runSpeedCheck, 10 * 1000);
  setInterval(runSpeedCheck, 60 * 1000);
});
