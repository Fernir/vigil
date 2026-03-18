export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicPages = ["/auth/login", "/auth/register", "/"];
  if (publicPages.includes(to.path)) return;

  // On client-side we use state (without jwt)
  if (process.client) {
    const { loggedIn, sessionLoaded } = useUserSession();

    // Wait for session loading
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

    if (!loggedIn.value) {
      return navigateTo("/auth/login");
    }

    return;
  }

  // On server-side we check the cookie and verify the JWT
  const token = useCookie("auth_token").value;

  if (!token) {
    return navigateTo("/auth/login");
  }

  // Dynamically import jsonwebtoken ONLY on the server to avoid bundling it in the client
  try {
    const { default: jwt } = await import("jsonwebtoken");
    jwt.verify(token, useRuntimeConfig().jwtSecret);
    // If verification is successful, allow the request to proceed
    return;
  } catch {
    return navigateTo("/auth/login");
  }
});
