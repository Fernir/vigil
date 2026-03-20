import { useDB, dbAll } from "~~/server/utils/db";
import { checkAdmin } from "~~/server/utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });

  const db = useDB();
  const sites = await dbAll(
    db,
    "SELECT * FROM sites WHERE userId = ? ORDER BY created_at DESC",
    [id],
  );
  return sites;
});
