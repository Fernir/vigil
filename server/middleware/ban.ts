import { useDB, dbGet } from "../utils/db";

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

  const db = useDB();
  const user = await dbGet<{ banned_at: string | null }>(
    db,
    "SELECT banned_at FROM users WHERE id = ?",
    [userId],
  );

  if (user?.banned_at) {
    throw createError({
      statusCode: 200,
      message: "Your account has been banned",
    });
  }
});
