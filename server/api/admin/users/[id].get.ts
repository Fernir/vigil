import { useDB, dbAll } from "~~/server/utils/db";
import { checkAdmin } from "~~/server/utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });
  const db = useDB();
  const user = await dbAll(
    db,
    "SELECT id, email, max_sites, banned_at, is_admin FROM users WHERE id = ?",
    [id],
  );

  return user[0] || null;
});
