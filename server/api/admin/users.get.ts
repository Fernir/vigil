import { useDB, dbAll } from "../../utils/db";
import { checkAdmin } from "../../utils/checkAdmin";

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const db = useDB();
  const users = await dbAll(
    db,
    "SELECT id, email, max_sites, banned_at, is_admin FROM users ORDER BY created_at DESC",
  );
  return users;
});
