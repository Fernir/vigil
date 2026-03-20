import { useDB, dbRun } from "~~/server/utils/db";
import { checkAdmin } from "~~/server/utils/checkAdmin";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  checkInterval: z.number().min(1).max(60).default(5),
  isActive: z.boolean().default(true),
  check_type: z.enum(["http", "text"]).default("http"),
  expected_text: z.string().optional().nullable(),
  text_condition: z.enum(["contains", "not_contains"]).default("contains"),
  userId: z.number(),
});

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const body = await readBody(event);
  const validated = createSchema.parse(body);

  const db = useDB();
  const result = await dbRun(
    db,
    `INSERT INTO sites (name, url, checkInterval, isActive, userId, check_type, expected_text, text_condition, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      validated.name,
      validated.url,
      validated.checkInterval,
      validated.isActive ? 1 : 0,
      validated.userId,
      validated.check_type,
      validated.expected_text || null,
      validated.text_condition,
    ],
  );

  return { id: result.lastID, ...validated };
});
