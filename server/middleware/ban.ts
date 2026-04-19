import { deleteCookie } from 'h3';
import prisma from '~~/lib/prisma';

export default defineEventHandler(async (event) => {
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/session'];

  if (publicRoutes.some((route) => event.path.startsWith(route))) return;

  const userId = event.context.auth?.userId;

  if (!userId) return;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { banned_at: true },
  });

  if (user?.banned_at) {
    deleteCookie(event, 'auth_token', { path: '/' });
    throw createError({
      statusCode: 403,
      message: 'Your account has been banned',
    });
  }
});
