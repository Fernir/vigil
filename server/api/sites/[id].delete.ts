import { useDB, dbRun } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Invalid site ID",
    });
  }

  await dbRun(db, "DELETE FROM sites WHERE id = ?", [id]);

  return { success: true };
});
