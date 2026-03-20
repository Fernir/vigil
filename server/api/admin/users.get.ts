import prisma from "~~/lib/prisma";
import { checkAdmin } from "~~/server/utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const users = await prisma.users.findMany({
    orderBy: { created_at: "desc" },
  });
  return users;
});
