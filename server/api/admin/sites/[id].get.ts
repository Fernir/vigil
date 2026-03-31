import prisma from '~~/lib/prisma';
import { checkAdmin } from '~~/server/utils/checkAdmin';

export default defineEventHandler(async (event) => {
  await checkAdmin(event);

  const id = parseInt(event.context.params?.id || '0');

  if (!id) throw createError({ statusCode: 400, message: 'Invalid site ID' });

  const site = await prisma.sites.findUnique({
    where: { id },
  });

  if (!site) throw createError({ statusCode: 404, message: 'Site not found' });

  return site;
});
