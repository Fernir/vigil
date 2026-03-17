import { useDB, dbAll, dbGet } from "../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();

  // Общее количество активных сайтов
  const totalSites = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites WHERE isActive = 1`,
  );

  // Количество сайтов со статусом 'up' в последней проверке
  const operational = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites s
     WHERE s.isActive = 1
     AND EXISTS (
       SELECT 1 FROM check_results c
       WHERE c.siteId = s.id
       AND c.status = 'up'
       AND c.checkedAt = (
         SELECT MAX(checkedAt) FROM check_results WHERE siteId = s.id
       )
     )`,
  );

  // Количество сайтов со статусом 'degraded' в последней проверке
  const degraded = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites s
     WHERE s.isActive = 1
     AND EXISTS (
       SELECT 1 FROM check_results c
       WHERE c.siteId = s.id
       AND c.status = 'degraded'
       AND c.checkedAt = (
         SELECT MAX(checkedAt) FROM check_results WHERE siteId = s.id
       )
     )`,
  );

  // Количество сайтов со статусом 'down' в последней проверке
  const down = await dbGet<{ count: number }>(
    db,
    `SELECT COUNT(*) as count FROM sites s
     WHERE s.isActive = 1
     AND EXISTS (
       SELECT 1 FROM check_results c
       WHERE c.siteId = s.id
       AND c.status = 'down'
       AND c.checkedAt = (
         SELECT MAX(checkedAt) FROM check_results WHERE siteId = s.id
       )
     )`,
  );

  // ---- Расчёт среднего аптайма за 30 дней ----
  let overallUptime = 100; // значение по умолчанию

  // Получаем все активные сайты
  const sites = await dbAll<any>(db, `SELECT id FROM sites WHERE isActive = 1`);

  if (sites.length > 0) {
    let totalUptimeSum = 0;
    let sitesWithData = 0;

    for (const site of sites) {
      // Считаем количество проверок за последние 30 дней и количество up
      const stats = await dbGet<{ total: number; up: number }>(
        db,
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up
         FROM check_results
         WHERE siteId = ? AND checkedAt >= datetime('now', '-30 days')`,
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
