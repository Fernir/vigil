export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicPages = ['/auth/login', '/auth/register', '/'];
  if (publicPages.includes(to.path)) return;

  if (process.client) {
    const { loggedIn, sessionLoaded } = useUserSession();

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
      return navigateTo('/auth/login');
    }

    return;
  }

  const token = useCookie('auth_token').value;

  if (!token) {
    return navigateTo('/auth/login');
  }

  try {
    const { default: jwt } = await import('jsonwebtoken');
    jwt.verify(token, useRuntimeConfig().jwtSecret);
    return;
  } catch {
    return navigateTo('/auth/login');
  }
});
