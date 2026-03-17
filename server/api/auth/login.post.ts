import { useDB, dbGet } from "../../utils/db";
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
    const db = useDB();

    const user = await dbGet<any>(db, "SELECT * FROM users WHERE email = ?", [
      validated.email,
    ]);

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
      token,
    };
  } catch (error) {
    // Проверяем, является ли ошибка от Zod
    if (error instanceof z.ZodError) {
      // Безопасно получаем первое сообщение об ошибке
      const firstError = error.errors[0];
      const errorMessage = firstError?.message || "Validation error";

      throw createError({
        statusCode: 400,
        message: errorMessage,
      });
    }

    // Если это уже createError, просто пробрасываем дальше
    throw error;
  }
});
