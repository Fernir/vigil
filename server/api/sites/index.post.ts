import prisma from "~~/lib/prisma";
import { z } from "zod";

export const siteSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  checkInterval: z.number().min(30).max(3600).default(60), // 30 sec to 1 hour
  isActive: z.boolean().default(true),
  check_type: z.enum(["http", "text"]).default("http"),
  expected_text: z.string().optional().nullable(),
  text_condition: z.enum(["contains", "not_contains"]).default("contains"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const auth = event.context.auth;
    if (!auth?.userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // Check site limit
    const siteCount = await prisma.sites.count({
      where: { userId: auth.userId },
    });

    const user = await prisma.users.findUnique({
      where: { id: auth.userId },
      select: { max_sites: true },
    });

    if (siteCount >= (user?.max_sites || 4)) {
      throw createError({
        statusCode: 403,
        message: `You have reached your site limit (${user?.max_sites || 4})`,
      });
    }

    const validated = siteSchema.parse(body);

    const newSite = await prisma.sites.create({
      data: {
        name: validated.name,
        url: validated.url,
        checkInterval: validated.checkInterval,
        isActive: validated.isActive,
        userId: auth.userId,
        check_type: validated.check_type,
        expected_text: validated.expected_text,
        text_condition: validated.text_condition,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return newSite;
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
