import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");

  if (!id) {
    throw createError({ statusCode: 400, message: "Invalid site ID" });
  }

  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const site = await prisma.sites.findUnique({
    where: { id: id },
  });

  if (!site) {
    throw createError({ statusCode: 404, message: "Site not found" });
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  });

  if (site.userId !== userId && !user?.is_admin) {
    throw createError({
      statusCode: 403,
      message: "You can only delete your own sites",
    });
  }

  await prisma.sites.delete({
    where: { id: id },
  });

  return { success: true };
});
