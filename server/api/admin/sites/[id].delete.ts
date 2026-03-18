import { useDB, dbAll, dbRun } from "../../../utils/db";
import { checkAdmin } from "../../../utils/checkAdmin";
import fs from "fs/promises";
import path from "path";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });

  const db = useDB();

  // 1. Get all sites for the user
  const sites = await dbAll<any>(db, "SELECT id FROM sites WHERE userId = ?", [
    id,
  ]);

  // 2. For each site, delete screenshots from disk
  for (const site of sites) {
    const screenshots = await dbAll<any>(
      db,
      "SELECT filename FROM screenshots WHERE siteId = ?",
      [site.id],
    );
    for (const s of screenshots) {
      const filePath = path.join(
        process.cwd(),
        "public/screenshots",
        s.filename,
      );
      await fs.unlink(filePath).catch(() => {});
    }
  }

  // 3. Delete the user (cascaded deletion of sites and their screenshots from the DB)
  await dbRun(db, "DELETE FROM users WHERE id = ?", [id]);

  return { success: true };
});
