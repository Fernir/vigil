export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicPages = ["/auth/login", "/auth/register", "/"];
  if (publicPages.includes(to.path)) return;

  // На клиенте используем стейт (без jwt)
  if (process.client) {
    const { loggedIn, sessionLoaded } = useUserSession();

    // Ждём загрузки сессии
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

  // На сервере проверяем куку
  const token = useCookie("auth_token").value;

  if (!token) {
    return navigateTo("/auth/login");
  }

  // Динамически импортируем jsonwebtoken ТОЛЬКО на сервере
  try {
    const { default: jwt } = await import("jsonwebtoken");
    jwt.verify(token, useRuntimeConfig().jwtSecret);
    // Если верификация успешна, пропускаем
    return;
  } catch {
    return navigateTo("/auth/login");
  }
});
