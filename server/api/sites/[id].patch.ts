import { useDB, dbRun, dbGet } from "../../utils/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  checkInterval: z.number().min(1).max(60).optional(),
  isActive: z.boolean().optional(),
  check_type: z.enum(["http", "text"]).optional(),
  expected_text: z.string().nullable().optional(),
  text_condition: z.enum(["contains", "not_contains"]).optional(),
});

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "Invalid site ID" });
  }

  try {
    const validated = updateSchema.parse(body);

    // Get userId from context (set in auth middleware)
    const userId = event.context.auth?.userId;
    if (!userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // Check if the site exists and belongs to this user    // If not found – 404
    const existingSite = await dbGet<any>(
      db,
      "SELECT id, userId FROM sites WHERE id = ?",
      [id],
    );

    if (!existingSite) {
      throw createError({ statusCode: 404, message: "Site not found" });
    }

    if (existingSite.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: "You can only edit your own sites",
      });
    }

    // Build dynamic SQL query
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

    // Add updatedAt
    updates.push('updatedAt = datetime("now")');

    if (updates.length === 0) {
      return { message: "No fields to update" };
    }

    // Add ID to the end of the values array
    values.push(id);

    // Execute the update
    await dbRun(
      db,
      `UPDATE sites SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Get the updated site
    const updatedSite = await dbGet<any>(
      db,
      "SELECT * FROM sites WHERE id = ?",
      [id],
    );

    return updatedSite;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || "Validation error";
      throw createError({ statusCode: 400, message: errorMessage });
    }
    throw error;
  }
});
