export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const { loggedIn } = useUserSession();

    if (loggedIn.value) {
      return navigateTo('/');
    }
  }
});
