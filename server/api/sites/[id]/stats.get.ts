import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");
  const query = getQuery(event);
  const days = parseInt((query.days as string) || "7");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Invalid site ID",
    });
  }

  const results = await prisma.check_results.findMany({
    where: {
      siteId: id,
      checked_at: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      checked_at: "desc",
    },
  });

  return results;
});
