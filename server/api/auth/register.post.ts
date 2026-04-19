import prisma from "~~/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    const token = jwt.sign(
      { userId: result.id, email: result.email },
      useRuntimeConfig().jwtSecret,
      { expiresIn: "7d" },
    );

    setCookie(event, "auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
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
