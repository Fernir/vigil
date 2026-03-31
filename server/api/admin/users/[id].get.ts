import prisma from '~~/lib/prisma';
import { checkAdmin } from '~~/server/utils/checkAdmin';

export default defineEventHandler(async (event) => {
  await checkAdmin(event);

  const id = parseInt(event.context.params?.id || '0');

  if (!id) throw createError({ statusCode: 400, message: 'Invalid user ID' });

  const user = await prisma.users.findUnique({
    where: { id },
  });

  return user || null;
});
