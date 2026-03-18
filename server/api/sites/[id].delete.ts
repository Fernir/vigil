import { useDB, dbAll, dbRun } from "../../utils/db";
import fs from "fs/promises";
import path from "path";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");

  if (!id) {
    throw createError({ statusCode: 400, message: "Invalid site ID" });
  }

  // 1. Get the paths to screenshots of this site
  const screenshots = await dbAll<any>(
    db,
    "SELECT filename FROM screenshots WHERE siteId = ?",
    [id],
  );

  // 2. Delete the physical files
  for (const s of screenshots) {
    if (s.filename?.startsWith("/screenshots/")) {
      const fullPath = path.join(process.cwd(), "public", s.filename);
      await fs.unlink(fullPath).catch(() => {}); // ignore errors if the file doesn't exist
    }
  }

  // 3. Delete the site (records in screenshots will be deleted cascadingly due to FOREIGN KEY)
  await dbRun(db, "DELETE FROM sites WHERE id = ?", [id]);

  return { success: true };
});
