export default defineEventHandler(async (event) => {
  // Удаляем куку
  setCookie(event, "auth_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return { success: true };
});
