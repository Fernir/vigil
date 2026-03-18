// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, sessionLoaded } = useUserSession();

  if (process.client) {
    if (!sessionLoaded.value) {
      await new Promise((resolve) => {
        const unwatch = watch(sessionLoaded, (val) => {
          if (val) {
            unwatch();
            resolve(true);
          }
        });
      });
    }

    if (!user.value?.is_admin) {
      return navigateTo("/");
    }

    return;
  }

  // On server-side we check the cookie and verify the JWT
  const token = useCookie("auth_token").value;

  if (!token) {
    return navigateTo("/auth/login");
  }

  try {
    const { default: jwt } = await import("jsonwebtoken");
    const decoded = jwt.verify(token, useRuntimeConfig().jwtSecret) as {
      userId: number;
    };

    // Connect to DB and check if user is admin
    const { useDB, dbGet } = await import("../../server/utils/db");
    const db = useDB();
    const user = await dbGet<{ is_admin: boolean }>(
      db,
      "SELECT is_admin FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (!user?.is_admin) {
      return navigateTo("/");
    }

    return;
  } catch {
    return navigateTo("/auth/login");
  }
});
