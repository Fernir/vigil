import { createError } from "h3";
import type { H3Event } from "h3";
import prisma from "~~/lib/prisma";

export async function requireSiteOwner(event: H3Event, siteId: number) {
  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const site = await prisma.sites.findUnique({
    where: { id: siteId },
    select: { userId: true },
  });

  if (!site) {
    throw createError({ statusCode: 404, message: "Site not found" });
  }

  if (site.userId !== userId) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }
}
