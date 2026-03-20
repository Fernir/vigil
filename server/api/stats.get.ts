import { useDB, dbAll, dbGet } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();

  // Overall sum of active sites
  const totalSites = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites WHERE isActive = 1`,
  );

  // Number of sites with 'up' status in the last check
  const operational = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites s
     WHERE s.isActive = 1
     AND EXISTS (
       SELECT 1 FROM check_results c
       WHERE c.siteId = s.id
       AND c.status = 'up'
       AND c.checked_at = (
         SELECT MAX(checked_at) FROM check_results WHERE siteId = s.id
       )
     )`,
  );

  // Number of sites with 'degraded' status in the last check
  const degraded = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites s
     WHERE s.isActive = 1
     AND EXISTS (
       SELECT 1 FROM check_results c
       WHERE c.siteId = s.id
       AND c.status = 'degraded'
       AND c.checked_at = (
         SELECT MAX(checked_at) FROM check_results WHERE siteId = s.id
       )
     )`,
  );

  // Number of sites with 'down' status in the last check
  const down = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites s
     WHERE s.isActive = 1
     AND EXISTS (
       SELECT 1 FROM check_results c
       WHERE c.siteId = s.id
       AND c.status = 'down'
       AND c.checked_at = (
         SELECT MAX(checked_at) FROM check_results WHERE siteId = s.id
       )
     )`,
  );

  // ---- Calculate average uptime over the last 30 days ----
  let overallUptime = 100; // value by default

  // Get all active sites
  const sites = await dbAll<any>(db, `SELECT id FROM sites WHERE isActive = 1`);

  if (sites.length > 0) {
    let totalUptimeSum = 0;
    let sitesWithData = 0;

    for (const site of sites) {
      // Calculate the number of checks over the last 30 days and the number of 'up' statuses
      const stats = await dbGet<{ total: number; up: number }>(
        db,
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up
         FROM check_results
         WHERE siteId = ? AND checked_at >= datetime('now', '-30 days')`,
        [site.id],
      );

      if (stats && stats.total > 0) {
        const uptime = (stats.up / stats.total) * 100;
        totalUptimeSum += uptime;
        sitesWithData++;
      }
    }

    if (sitesWithData > 0) {
      overallUptime = Math.round(totalUptimeSum / sitesWithData);
    }
  }

  return {
    total: totalSites?.count || 0,
    operational: operational?.count || 0,
    degraded: degraded?.count || 0,
    down: down?.count || 0,
    overallUptime,
  };
});
