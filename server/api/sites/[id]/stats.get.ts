import { useDB, dbAll } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");
  const query = getQuery(event);
  const days = parseInt((query.days as string) || "7");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Invalid site ID",
    });
  }

  const results = await dbAll<any>(
    db,
    'SELECT * FROM check_results WHERE siteId = ? AND checkedAt >= datetime("now", ?) ORDER BY checkedAt DESC',
    [id, `-${days} days`],
  );

  return results;
});
