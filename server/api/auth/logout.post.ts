export default defineEventHandler(async (event) => {
  // Delete the auth token cookie
  setCookie(event, "auth_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return { success: true };
});
