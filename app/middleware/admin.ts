export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const { user, sessionLoaded } = useUserSession();

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
      return navigateTo('/');
    }

    return;
  }

  const token = useCookie('auth_token').value;

  if (!token) {
    return navigateTo('/auth/login');
  }

  try {
    const { default: jwt } = await import('jsonwebtoken');
    const decoded = jwt.verify(token, useRuntimeConfig().jwtSecret) as {
      userId: number;
    };

    const prisma = (await import('~~/lib/prisma')).default;

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { is_admin: true },
    });

    if (!user?.is_admin) {
      return navigateTo('/');
    }

    return;
  } catch {
    return navigateTo('/auth/login');
  }
});
