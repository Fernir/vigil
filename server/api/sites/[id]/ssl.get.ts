import prisma from "~~/lib/prisma";
import { requireSiteOwner } from "~~/server/utils/requireSiteOwner";

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");
  if (!id) {
    throw createError({ statusCode: 400, message: "Invalid site ID" });
  }

  await requireSiteOwner(event, id);

  const results = await prisma.ssl_results.findMany({
    where: { siteId: id },
    orderBy: { checked_at: "desc" },
    take: 30,
  });

  return results;
});
