import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  // Пропускаем публичные маршруты
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/session",
  ];
  if (publicRoutes.some((route) => event.path.startsWith(route))) return;

  const userId = event.context.auth?.userId;
  if (!userId) return; // неавторизованные уже отсеяны в auth.ts

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { banned_at: true },
  });

  if (user?.banned_at) {
    throw createError({
      statusCode: 200,
      message: "Your account has been banned",
    });
  }
});
