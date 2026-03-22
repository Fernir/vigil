import prisma from "~~/lib/prisma";

export async function checkAdmin(event: any) {
  const userId = event.context.auth?.userId;

  if (!userId)
    throw createError({ statusCode: 401, message: "Authentication required" });

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  });

  if (!user?.is_admin)
    throw createError({
      statusCode: 403,
      message: "Admin privileges required",
    });
}
