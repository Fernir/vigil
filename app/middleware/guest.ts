export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession();

  // If the user is already logged in, redirect to the dashboard
  if (loggedIn.value) {
    return navigateTo("/");
  }
});
