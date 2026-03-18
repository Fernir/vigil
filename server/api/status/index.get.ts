import { useDB, dbAll, dbGet } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();

  const sites = await dbAll<any>(
    db,
    "SELECT * FROM sites ORDER BY created_at DESC",
  );

  // For each site we get the last result to determine its current status
  const sitesWithStatus = await Promise.all(
    sites.map(async (site) => {
      const lastResult = await dbGet<any>(
        db,
        "SELECT * FROM check_results WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1",
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
