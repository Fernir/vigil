import { useDB, dbGet, dbRun, dbAll } from "../../utils/db";
import fs from "fs/promises";
import path from "path";

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

  // If delete is not admin, but owner – allow
  // If admin – also allow, but only if site belongs to someone else (to prevent self-deletion of sites)

  // Get all screenshots for this site
  const screenshots = await dbAll<any>(
    db,
    "SELECT filename FROM screenshots WHERE siteId = ?",
    [id],
  );

  // Delete files from disk
  for (const s of screenshots) {
    const filePath = path.join(process.cwd(), "public/screenshots", s.filename);
    await fs.unlink(filePath).catch(() => {
      // Ignore errors if file is already deleted or doesn't exist
    });
  }

  // Delete site (screenshots will be deleted cascaded in DB)
  await dbRun(db, "DELETE FROM sites WHERE id = ?", [id]);

  return { success: true, deletedFiles: screenshots.length };
});
