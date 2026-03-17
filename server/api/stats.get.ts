import { useDB, dbGet } from "../utils/db";

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

  // Общий uptime (средний процент аптайма за последние 30 дней)
  // Более сложный запрос, можно упростить или добавить позже.
  // Пока можно вернуть 100 как заглушку, либо рассчитать на основе всех проверок.
  const overallUptime = 100; // Заглушка, можно рассчитать позже

  return {
    total: totalSites?.count || 0,
    operational: operational?.count || 0,
    degraded: degraded?.count || 0,
    down: down?.count || 0,
    overallUptime,
  };
});
