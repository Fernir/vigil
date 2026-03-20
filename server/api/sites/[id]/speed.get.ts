import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid site ID" });

  const results = await prisma.speed_results.findMany({
    where: { siteId: id },
    orderBy: { checked_at: "desc" },
    take: 30,
  });

  return results;
});
