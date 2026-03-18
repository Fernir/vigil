import { useDB, dbRun } from "../../../utils/db";
import { checkAdmin } from "../../../utils/checkAdmin";
import { z } from "zod";

const bodySchema = z.object({
  max_sites: z.number().min(1).max(100).optional(),
  banned_at: z.string().nullable().optional(),
  is_admin: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid user ID" });

  const body = await readBody(event);
  const validated = bodySchema.parse(body);

  const db = useDB();
  const updates = [];
  const values = [];

  if (validated.max_sites !== undefined) {
    updates.push("max_sites = ?");
    values.push(validated.max_sites);
  }
  if (validated.banned_at !== undefined) {
    updates.push("banned_at = ?");
    values.push(validated.banned_at);
  }
  if (validated.is_admin !== undefined) {
    updates.push("is_admin = ?");
    values.push(validated.is_admin ? 1 : 0);
  }
  if (updates.length === 0) return { message: "Nothing to update" };

  values.push(id);
  await dbRun(
    db,
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );
  return { success: true };
});
