import prisma from '~~/lib/prisma';
import { requireSiteOwner } from '~~/server/utils/requireSiteOwner';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  if (!id) {
    throw createError({ statusCode: 400, message: 'Invalid site ID' });
  }

  await requireSiteOwner(event, id);

  const screenshot = await prisma.screenshots.findFirst({
    where: { siteId: id },
    orderBy: { checked_at: 'desc' },
    take: 1,
  });

  if (!screenshot) return null;

  return screenshot?.image_data;
});
