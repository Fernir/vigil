import { useDB, dbAll, dbRun } from "~~/server/utils/db";
import { checkAdmin } from "~~/server/utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });

  const db = useDB();

  // 1. Get all sites for the user
  await dbAll<any>(db, "SELECT id FROM sites WHERE userId = ?", [id]);

  // 3. Delete the user (cascaded deletion of sites and their screenshots from the DB)
  await dbRun(db, "DELETE FROM users WHERE id = ?", [id]);

  return { success: true };
});
