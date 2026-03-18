import { useDB, dbAll } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();

  const sites = await dbAll<any>(
    db,
    "SELECT * FROM sites ORDER BY created_at DESC",
  );

  return sites;
});
