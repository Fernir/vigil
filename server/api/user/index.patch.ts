import { useDB, dbRun } from "~~/server/utils/db";
import { z } from "zod";

const updateUserSchema = z.object({
  webhook_url: z.string().url().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;
  if (!auth?.userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const validated = updateUserSchema.parse(body);

  const db = useDB();
  await dbRun(
    db,
    'UPDATE users SET webhook_url = ?, updatedAt = datetime("now") WHERE id = ?',
    [validated.webhook_url || null, auth.userId],
  );

  return { success: true };
});
