// server/utils/checkAdmin.ts
import { useDB, dbGet } from "./db";

export async function checkAdmin(event: any) {
  const userId = event.context.auth?.userId;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const db = useDB();
  const user = await dbGet<{ is_admin: boolean }>(
    db,
    "SELECT is_admin FROM users WHERE id = ?",
    [userId],
  );
  if (!user?.is_admin)
    throw createError({ statusCode: 403, message: "Admin access required" });
}
