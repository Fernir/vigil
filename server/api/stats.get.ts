import prisma from '~~/lib/prisma';

export default defineEventHandler(async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sites = await prisma.sites.findMany({
    where: { isActive: true },
    include: {
      check_results: {
        orderBy: { checked_at: 'desc' },
        take: 1,
        where: {
          checked_at: { gte: thirtyDaysAgo },
        },
      },
    },
  });

  if (sites.length === 0) {
    return {
      total: 0,
      operational: 0,
      degraded: 0,
      down: 0,
      overallUptime: 100,
    };
  }

  const siteIds = sites.map((s) => s.id);

  const grouped = await prisma.check_results.groupBy({
    by: ['siteId', 'status'],
    where: {
      siteId: { in: siteIds },
      checked_at: { gte: thirtyDaysAgo },
    },
    _count: { _all: true },
  });

  type Counts = { total: number; up: number };
  const counts = new Map<number, Counts>();
  for (const id of siteIds) {
    counts.set(id, { total: 0, up: 0 });
  }

  for (const row of grouped) {
    if (row.siteId == null) continue;
    const c = counts.get(row.siteId);
    if (!c) continue;
    const n = row._count._all;
    c.total += n;
    if (row.status === 'up') {
      c.up += n;
    }
  }

  let operational = 0;
  let degraded = 0;
  let down = 0;
  let totalUptimeSum = 0;
  let sitesWithData = 0;

  for (const site of sites) {
    const lastCheck = site.check_results[0];
    if (lastCheck) {
      switch (lastCheck.status) {
        case 'up':
          operational++;
          break;
        case 'degraded':
          degraded++;
          break;
        case 'down':
          down++;
          break;
      }
    }

    const c = counts.get(site.id);
    if (c && c.total > 0) {
      totalUptimeSum += (c.up / c.total) * 100;
      sitesWithData++;
    }
  }

  const overallUptime =
    sitesWithData > 0 ? Math.round(totalUptimeSum / sitesWithData) : 100;

  return {
    total: sites.length,
    operational,
    degraded,
    down,
    overallUptime,
  };
});
