import prisma from "~~/lib/prisma";
import { checkAdmin } from "~~/server/utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });

  // 1. Delete all sites for the user
  await prisma.sites.deleteMany({
    where: { userId: id },
  });

  // 3. Delete the user (cascaded deletion of sites and their screenshots from the DB)
  await prisma.users.delete({
    where: { id: id },
  });

  return { success: true };
});
