import { useDB, dbRun } from "../../utils/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  checkInterval: z.number().min(1).max(60).default(5),
  isActive: z.boolean().default(true),
  check_type: z.enum(["http", "text"]).default("http"),
  expected_text: z.string().optional().nullable(),
  text_condition: z.enum(["contains", "not_contains"]).default("contains"),
});

export default defineEventHandler(async (event) => {
  const db = useDB();
  const body = await readBody(event);

  try {
    const auth = event.context.auth;
    if (!auth?.userId) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const siteCount = await dbGet<{ count: number }>(
      db,
      "SELECT COUNT(*) as count FROM sites WHERE userId = ?",
      [auth.userId],
    );
    const user = await dbGet<{ max_sites: number }>(
      db,
      "SELECT max_sites FROM users WHERE id = ?",
      [auth.userId],
    );

    if (siteCount.count >= user.max_sites) {
      throw createError({
        statusCode: 403,
        message: `You have reached your site limit (${user.max_sites})`,
      });
    }

    const validated = createSchema.parse(body);

    const result = await dbRun(
      db,
      `INSERT INTO sites 
   (name, url, checkInterval, isActive, userId, check_type, expected_text, text_condition, createdAt, updatedAt) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        validated.name,
        validated.url,
        validated.checkInterval,
        validated.isActive ? 1 : 0,
        auth.userId,
        validated.check_type,
        validated.expected_text || null,
        validated.text_condition,
      ],
    );

    return {
      id: result.lastID,
      ...validated,
      userId: auth.userId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || "Validation error";

      throw createError({
        statusCode: 400,
        message: errorMessage,
      });
    }
    throw error;
  }
});
