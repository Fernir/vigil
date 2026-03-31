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

    const allChecks = await prisma.check_results.count({
      where: {
        siteId: site.id,
        checked_at: { gte: thirtyDaysAgo },
      },
    });

    const upChecks = await prisma.check_results.count({
      where: {
        siteId: site.id,
        checked_at: { gte: thirtyDaysAgo },
        status: 'up',
      },
    });

    if (allChecks > 0) {
      const uptime = (upChecks / allChecks) * 100;
      totalUptimeSum += uptime;
      sitesWithData++;
    }
  }

  const overallUptime = sitesWithData > 0 ? Math.round(totalUptimeSum / sitesWithData) : 100;

  return {
    total: sites.length,
    operational,
    degraded,
    down,
    overallUptime,
  };
});
