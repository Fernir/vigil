import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;

  if (!auth?.userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const sites = await prisma.sites.findMany({
    where: { userId: auth.userId },
    orderBy: { created_at: "desc" },
  });

  // For each site we get the last result to determine its current status
  const sitesWithStatus = await Promise.all(
    sites.map(async (site) => {
      const lastResult = await prisma.check_results.findFirst({
        where: { siteId: site.id },
        orderBy: { checked_at: "desc" },
      });

      return {
        ...site,
        lastCheck: lastResult || null,
      };
    }),
  );

  return sitesWithStatus;
});
