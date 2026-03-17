export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  // Если пользователь уже авторизован, перенаправляем на дашборд
  if (loggedIn.value) {
    return navigateTo("/");
  }
});
