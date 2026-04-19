import prisma from "~~/lib/prisma";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const validated = loginSchema.parse(body);

    const user = await prisma.users.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    const validPassword = await bcrypt.compare(
      validated.password,
      user.password,
    );

    if (!validPassword) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
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

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  } catch (error) {
    // Check if the error is from Zod
    if (error instanceof z.ZodError) {
      // Safely get the first error message
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || "Validation error";

      throw createError({
        statusCode: 400,
        message: errorMessage,
      });
    }

    // If this is already a createError, just throw it further
    throw error;
  }
});
