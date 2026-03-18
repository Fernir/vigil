import { useDB, dbGet } from "../../utils/db";
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
      console.log("Session check - Token valid for userId:", decoded.userId);
    } catch (error: unknown) {
      // Manage different types of JWT errors
      if (error instanceof jwt.JsonWebTokenError) {
        console.log("Session check - JWT Error:", error.message);
      } else if (error instanceof jwt.TokenExpiredError) {
        console.log("Session check - Token expired");
      } else if (error instanceof Error) {
        console.log("Session check - Error:", error.message);
      } else {
        console.log("Session check - Unknown error");
      }
      return { user: null };
    }

    const db = useDB();
    const user = await dbGet<any>(
      db,
      "SELECT id, email, webhook_url, is_admin, banned_at FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (!user) {
      console.log("Session check - User not found");
      return { user: null };
    }

    return { user };
  } catch (error: unknown) {
    console.error("Session check - Error:", error);
    return { user: null };
  }
});
