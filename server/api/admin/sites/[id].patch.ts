import prisma from "~~/lib/prisma";
import { checkAdmin } from "~~/server/utils/checkAdmin";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  checkInterval: z.number().min(1).max(60).optional(),
  isActive: z.boolean().optional(),
  check_type: z.enum(["http", "text"]).optional(),
  expected_text: z.string().nullable().optional(),
  text_condition: z.enum(["contains", "not_contains"]).optional(),
  userId: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  await checkAdmin(event);
  const id = parseInt(event.context.params?.id || "0");
  if (!id) throw createError({ statusCode: 400, message: "Invalid site ID" });

  const body = await readBody(event);

  let validated;
  try {
    validated = updateSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, message: error.errors[0]?.message });
    }
    throw error;
  }

  // Проверяем существование сайта
  const existing = await prisma.sites.findUnique({
    where: { id: id },
  });

  if (!existing) {
    throw createError({ statusCode: 404, message: "Site not found" });
  }

  await prisma.sites.update({
    where: { id: id },
    data: validated,
  });

  const updated = await prisma.sites.findUnique({
    where: { id: id },
  });
  return updated;
});
