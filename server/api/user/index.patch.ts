import prisma from "~~/lib/prisma";
import { assertSafeWebhookUrl } from "~~/server/utils/safeWebhookUrl";
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

  if (validated.webhook_url) {
    assertSafeWebhookUrl(validated.webhook_url);
  }

  await prisma.users.update({
    where: { id: auth.userId },
    data: {
      webhook_url: validated.webhook_url || null,
      updated_at: new Date(),
    },
  });

  return { success: true };
});
