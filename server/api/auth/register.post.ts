import prisma from "~~/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.users.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const result = await prisma.users.create({
      data: {
        email: validated.email,
        password: hashedPassword,
      },
    });

    return {
      user: {
        id: result.id,
        email: validated.email,
      },
      message: "Registration successful",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || "Validation error";

      throw createError({
        statusCode: 400,
        message: errorMessage,
      });
    }
    throw error;
  }
});
