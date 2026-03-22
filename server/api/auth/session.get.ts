import prisma from "~~/lib/prisma";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  try {
    // Get the token from the cookie
    const token = getCookie(event, "auth_token");

    if (!token) {
      return { user: null };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, useRuntimeConfig().jwtSecret) as {
        userId: number;
      };
    } catch (error: unknown) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { user: null, error: { message: error.message } };
      } else if (error instanceof jwt.TokenExpiredError) {
        return { user: null, error: { message: "Token expired" } };
      } else if (error instanceof Error) {
        return { user: null, error: { message: error.message } };
      } else {
        return { user: null, error: { message: "Unknown error" } };
      }
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        webhook_url: true,
        is_admin: true,
        banned_at: true,
      },
    });

    if (!user) {
      return { user: null };
    }

    return { user };
  } catch (error: unknown) {
    console.error("Session check - Error:", error);
    return { user: null };
  }
});
