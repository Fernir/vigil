import { useDB, dbAll } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");

  const results = await dbAll<any>(
    db,
    "SELECT * FROM screenshots WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1",
    [id],
  );

  return results[0] || null;
});
