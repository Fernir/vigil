import { useDB, dbAll, dbGet } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();

  const sites = await dbAll<any>(
    db,
    "SELECT * FROM sites ORDER BY createdAt DESC",
  );

  // Для каждого сайта получаем последний результат
  const sitesWithStatus = await Promise.all(
    sites.map(async (site) => {
      const lastResult = await dbGet<any>(
        db,
        "SELECT * FROM check_results WHERE siteId = ? ORDER BY checkedAt DESC LIMIT 1",
        [site.id],
      );

      return {
        ...site,
        lastCheck: lastResult || null,
      };
    }),
  );

  return sitesWithStatus;
});
