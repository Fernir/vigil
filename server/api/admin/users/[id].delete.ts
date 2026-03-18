import { useDB, dbRun } from "../../../utils/db";
import { checkAdmin } from "../../../utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });

  const db = useDB();
  await dbRun(db, "DELETE FROM users WHERE id = ?", [id]);
  return { success: true };
});
