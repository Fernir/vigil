import prisma from '~~/lib/prisma';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');

  const screenshot = await prisma.screenshots.findFirst({
    where: { siteId: id },
    orderBy: { checked_at: 'desc' },
    take: 1,
  });

  if (!screenshot) return null;

  // Convert BLOB to base64 for sending to the client
  return screenshot?.image_data;
});
