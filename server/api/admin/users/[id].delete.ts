import prisma from '~~/lib/prisma';
import { checkAdmin } from '~~/server/utils/checkAdmin';

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || '0');
  if (!id) throw createError({ statusCode: 400, message: 'Invalid user ID' });

  await prisma.sites.deleteMany({
    where: { userId: id },
  });

  await prisma.users.delete({
    where: { id: id },
  });

  return { success: true };
});
