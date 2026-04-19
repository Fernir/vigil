import { deleteCookie } from "h3";
import prisma from "~~/lib/prisma";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  try {
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

    if (user.banned_at) {
      deleteCookie(event, "auth_token", { path: "/" });
      return { user: null };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        webhook_url: user.webhook_url,
        is_admin: user.is_admin,
      },
    };
  } catch (error: unknown) {
    console.error("Session check - Error:", error);
    return { user: null };
  }
});
