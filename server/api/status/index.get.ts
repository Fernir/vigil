import { useDB, dbAll, dbGet } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();

  const auth = event.context.auth;

  if (!auth?.userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const sites = await dbAll<any>(
    db,
    "SELECT * FROM sites WHERE userId = ? ORDER BY created_at DESC",
    [auth.userId],
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
