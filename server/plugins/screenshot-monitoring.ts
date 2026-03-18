import { useDB, dbRun, dbAll } from "../utils/db";
import { takeAndSaveScreenshot } from "../utils/screenshot";
import fs from "fs/promises";
import path from "path";

export default defineNitroPlugin(() => {
  if (!process.dev) return;

  console.log("Screenshot monitoring запущен (раз в 6 часов)");

  const runScreenshot = async () => {
    const db = useDB();
    const sites = await dbAll<any>(
      db,
      `SELECT s.* FROM sites s WHERE s.isActive = 1`,
    );

    for (const site of sites) {
      try {
        console.log(`Capturing screenshot for ${site.url}...`);

        // Delete the previous screenshot (file and record in DB) if it exists
        const old = await dbAll<any>(
          db,
          "SELECT filename FROM screenshots WHERE siteId = ?",
          [site.id],
        );
        if (old.length > 0) {
          const oldPath = old[0].filename;
          // Delete the file if it's local (check by path prefix)
          if (oldPath.startsWith("/screenshots/")) {
            const fullPath = path.join(process.cwd(), "public", oldPath);
            await fs.unlink(fullPath).catch(() => {});
          }
          await dbRun(db, "DELETE FROM screenshots WHERE siteId = ?", [
            site.id,
          ]);
        }

        // Make the new screenshot and save it
        const result = await takeAndSaveScreenshot(site.id, site.url, {
          viewportWidth: 1280,
          viewportHeight: 800,
          fullPage: true,
          blockAds: true,
          blockCookieBanners: true,
          format: "png",
        });

        if (result) {
          await dbRun(
            db,
            `INSERT INTO screenshots (siteId, filename, width, height, checkedAt)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [site.id, result.filename, result.width, result.height],
          );
          console.log(`Screenshot saved (previous deleted)`);
        } else {
          console.log(`Failed to capture screenshot`);
        }
      } catch (error) {
        console.error(`Error processing ${site.url}:`, error);
      }
    }
  };

  setTimeout(runScreenshot, 5000);
  setInterval(runScreenshot, 6 * 60 * 60 * 1000);
});
