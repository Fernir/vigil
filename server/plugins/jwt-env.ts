export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "default-secret-change-me") {
    throw new Error(
      "[vigil] JWT_SECRET must be set to a strong random value in production.",
    );
  }
});
