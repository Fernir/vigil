import { useDB, dbGet, dbRun } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");

  if (!id) {
    throw createError({ statusCode: 400, message: "Invalid site ID" });
  }

  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // Check existence of the site and its owner
  const site = await dbGet<any>(db, "SELECT * FROM sites WHERE id = ?", [id]);

  if (!site) {
    throw createError({ statusCode: 404, message: "Site not found" });
  }

  // Check permissions: either owner or admin can delete
  const user = await dbGet<any>(db, "SELECT is_admin FROM users WHERE id = ?", [
    userId,
  ]);

  if (site.userId !== userId && !user?.is_admin) {
    throw createError({
      statusCode: 403,
      message: "You can only delete your own sites",
    });
  }

  // Delete site (screenshots will be deleted cascaded in DB)
  await dbRun(db, "DELETE FROM sites WHERE id = ?", [id]);

  return { success: true };
});
