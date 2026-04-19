import { computed } from 'vue';
import { navigateTo } from '#app';
import type { UserInterface } from '~~/types';
import { FetchError } from 'ofetch';

interface LoginResponse {
  user: UserInterface;
}

interface SessionResponse {
  user: UserInterface | null;
}

export const useUserSession = () => {
  const headers = process.server ? useRequestHeaders(['cookie']) : undefined;

  const {
    data: sessionData,
    pending: sessionPending,
    refresh,
  } = useAsyncData<SessionResponse>(
    'user-session',
    () =>
      $fetch<SessionResponse>('/api/auth/session', {
        headers,
        credentials: 'include',
      }),
    {
      default: () => ({ user: null }),
      server: true,
      lazy: false,
    },
  );

  const user = computed(() => sessionData.value?.user || null);
  const sessionLoaded = computed(() => !sessionPending.value);
  const loggedIn = computed(() => !!user.value);

  interface AuthResult {
    success: boolean;
    error?: string;
  }

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      });

      // Refresh session data
      await refresh();

      await navigateTo('/');

      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof FetchError ? e.message : 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });

      // Clear cookie on client
      if (process.client) {
        document.cookie = 'auth_token=; path=/; max-age=0';
      }

      // Refresh session data
      await refresh();

      await navigateTo('/auth/login');
    } catch (e: unknown) {
      console.error('Logout error:', e);
    }
  };

  const register = async (email: string, password: string): Promise<AuthResult> => {
    try {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      });

      await refresh();

      await navigateTo('/');

      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof FetchError ? e.message : 'Registration failed' };
    }
  };

  return {
    user,
    loggedIn,
    sessionLoaded,
    login,
    logout,
    register,
    loading: sessionPending,
    refresh,
  };
};
