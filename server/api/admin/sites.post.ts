import prisma from '~~/lib/prisma';
import { checkAdmin } from '~~/server/utils/checkAdmin';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  checkInterval: z.number().min(1).max(60).default(5),
  isActive: z.boolean().default(true),
  check_type: z.enum(['http', 'text']).default('http'),
  expected_text: z.string().optional().nullable(),
  text_condition: z.enum(['contains', 'not_contains']).default('contains'),
  userId: z.number(),
});

export default defineEventHandler(async (event) => {
  await checkAdmin(event);

  const body = await readBody(event);

  const validated = createSchema.parse(body);

  const result = await prisma.sites.create({
    data: {
      name: validated.name,
      url: validated.url,
      checkInterval: validated.checkInterval,
      isActive: validated.isActive,
      userId: validated.userId,
      check_type: validated.check_type,
      expected_text: validated.expected_text || null,
      text_condition: validated.text_condition,
    },
  });

  return { id: result.id, ...validated };
});
