import { useDB, dbAll } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const auth = event.context.auth;

  if (!auth?.userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const sites = await dbAll<any>(
    db,
    "SELECT * FROM sites WHERE userId = ? ORDER BY created_at DESC",
    [auth.userId],
  );

  return sites;
});
