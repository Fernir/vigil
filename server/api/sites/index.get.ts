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

  return sites;
});
