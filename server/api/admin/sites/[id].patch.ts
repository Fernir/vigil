import { useDB, dbRun, dbGet } from "../../../utils/db";
import { checkAdmin } from "../../../utils/checkAdmin";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  checkInterval: z.number().min(1).max(60).optional(),
  isActive: z.boolean().optional(),
  check_type: z.enum(["http", "text"]).optional(),
  expected_text: z.string().nullable().optional(),
  text_condition: z.enum(["contains", "not_contains"]).optional(),
  userId: z.number().optional(), // если нужно передать другому пользователю
});

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid site ID" });

  const body = await readBody(event);
  const validated = updateSchema.parse(body);

  const db = useDB();

  // Проверяем существование сайта
  const existing = await dbGet(db, "SELECT id FROM sites WHERE id = ?", [id]);
  if (!existing)
    throw createError({ statusCode: 404, message: "Site not found" });

  // Строим динамический запрос
  const updates: string[] = [];
  const values: any[] = [];

  if (validated.name !== undefined) {
    updates.push("name = ?");
    values.push(validated.name);
  }
  if (validated.url !== undefined) {
    updates.push("url = ?");
    values.push(validated.url);
  }
  if (validated.checkInterval !== undefined) {
    updates.push("checkInterval = ?");
    values.push(validated.checkInterval);
  }
  if (validated.isActive !== undefined) {
    updates.push("isActive = ?");
    values.push(validated.isActive ? 1 : 0);
  }
  if (validated.check_type !== undefined) {
    updates.push("check_type = ?");
    values.push(validated.check_type);
  }
  if (validated.expected_text !== undefined) {
    updates.push("expected_text = ?");
    values.push(validated.expected_text);
  }
  if (validated.text_condition !== undefined) {
    updates.push("text_condition = ?");
    values.push(validated.text_condition);
  }
  if (validated.userId !== undefined) {
    updates.push("userId = ?");
    values.push(validated.userId);
  }

  updates.push('updatedAt = datetime("now")');

  if (updates.length === 0) return { message: "No fields to update" };

  values.push(id);
  await dbRun(
    db,
    `UPDATE sites SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );

  const updated = await dbGet(db, "SELECT * FROM sites WHERE id = ?", [id]);
  return updated;
});
