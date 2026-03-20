import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");

  const results = await prisma.screenshots.findMany({
    where: { siteId: id },
    orderBy: { checked_at: "desc" },
    take: 1,
  });

  const screenshot = results[0];
  if (!screenshot) return null;

  // Convert BLOB to base64 for sending to the client
  return {
    id: screenshot.id,
    siteId: screenshot.siteId,
    image_base64: screenshot?.image_data?.toString?.("base64"),
    width: screenshot.width,
    height: screenshot.height,
    checked_at: screenshot.checked_at,
  };
});
