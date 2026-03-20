import prisma from "~~/lib/prisma";
import { z } from "zod";
import { siteSchema } from "./index.post";

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || "0");
  const body = await readBody(event);

  if (!id) throw createError({ statusCode: 400, message: "Invalid site ID" });

  try {
    const userId = event.context.auth?.userId;
    if (!userId)
      throw createError({ statusCode: 401, message: "Unauthorized" });

    const site = await prisma.sites.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!site)
      throw createError({ statusCode: 404, message: "Site not found" });
    if (site.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: "You can only edit your own sites",
      });
    }

    const validated = siteSchema.parse(body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.url !== undefined) updateData.url = validated.url;
    if (validated.checkInterval !== undefined)
      updateData.checkInterval = validated.checkInterval;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.check_type !== undefined)
      updateData.check_type = validated.check_type;
    if (validated.expected_text !== undefined)
      updateData.expected_text = validated.expected_text;
    if (validated.text_condition !== undefined)
      updateData.text_condition = validated.text_condition;
    updateData.updated_at = new Date();

    const updatedSite = await prisma.sites.update({
      where: { id },
      data: updateData,
    });

    return updatedSite;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: error?.errors?.[0]?.message,
      });
    }
    throw error;
  }
});
