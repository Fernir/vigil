import prisma from '~~/lib/prisma';
import { checkAdmin } from '~~/server/utils/checkAdmin';
import { z } from 'zod';

const bodySchema = z.object({
  max_sites: z.number().min(1).max(100).optional(),
  banned_at: z.string().nullable().optional(),
  is_admin: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || '0');
  if (!id) throw createError({ statusCode: 400, message: 'Invalid user ID' });

  const body = await readBody(event);
  const validated = bodySchema.parse(body);

  await prisma.users.update({
    where: { id },
    data: validated,
  });

  return { success: true };
});
