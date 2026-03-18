import { useDB, dbGet } from "../../../utils/db";
import { checkAdmin } from "../../../utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid site ID" });

  const db = useDB();
  const site = await dbGet<any>(db, "SELECT * FROM sites WHERE id = ?", [id]);
  if (!site) throw createError({ statusCode: 404, message: "Site not found" });

  return site;
});
