import { useDB, dbAll } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDB();
  const id = parseInt(event.context.params?.id || "0");

  const results = await dbAll<any>(
    db,
    "SELECT id, siteId, image_data, width, height, checked_at FROM screenshots WHERE siteId = ? ORDER BY checked_at DESC LIMIT 1",
    [id],
  );

  const screenshot = results[0];
  if (!screenshot) return null;

  // Convert BLOB to base64 for sending to the client
  return {
    id: screenshot.id,
    siteId: screenshot.siteId,
    image_base64: screenshot.image_data.toString("base64"),
    width: screenshot.width,
    height: screenshot.height,
    checked_at: screenshot.checked_at,
  };
});
