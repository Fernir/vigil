import { useDB, dbAll } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");
  if (!id) {
    throw createError({ statusCode: 400, message: "Invalid site ID" });
  }

  const results = await dbAll<any>(
    db,
    "SELECT * FROM ssl_results WHERE siteId = ? ORDER BY checked_at DESC LIMIT 30",
    [id],
  );
  return results;
});
