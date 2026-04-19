import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const path = event.path;

  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/session",
    "/api/stats",
    "/api/sse",
  ];

  if (publicRoutes.some((route) => path.startsWith(route))) {
    return;
  }

  if (path.startsWith("/api/")) {
    const token = getCookie(event, "auth_token");
    if (!token) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }
    try {
      const decoded = jwt.verify(token, useRuntimeConfig().jwtSecret);
      event.context.auth = decoded;
    } catch {
      throw createError({
        statusCode: 401,
        message: "Invalid token",
      });
    }
  }
});
