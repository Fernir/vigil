// app/composables/useUserSession.ts
import { computed } from "vue";
import { navigateTo } from "#app";
import type { UserInterface } from "~~/types";

interface LoginResponse {
  user: UserInterface;
  token?: string;
}

interface SessionResponse {
  user: UserInterface | null;
}

export const useUserSession = () => {
  const headers = process.server ? useRequestHeaders(["cookie"]) : undefined;

  const {
    data: sessionData,
    pending: sessionPending,
    refresh,
  } = useAsyncData<SessionResponse>(
    "user-session",
    () =>
      $fetch<SessionResponse>("/api/auth/session", {
        headers,
        credentials: "include",
      }),
    {
      default: () => ({ user: null }),
      server: true,
      lazy: false,
    },
  );

  const user = computed(() => sessionData.value?.user || null);
  const loggedIn = computed(() => !!user.value);
  const sessionLoaded = computed(() => !sessionPending.value);

  const login = async (email: string, password: string) => {
    try {
      await $fetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        credentials: "include",
      });

      // Refresh session data
      await refresh();

      await navigateTo("/");

      return { success: true };
    } catch (e: any) {
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });

      // Clear cookie on client
      if (process.client) {
        document.cookie = "auth_token=; path=/; max-age=0";
      }

      // Refresh session data
      await refresh();

      await navigateTo("/auth/login");
    } catch (e: any) {
      console.error("Logout error:", e);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: { email, password },
      });

      await navigateTo("/auth/login");
    } catch (e: any) {
      throw new Error(e.message || "Registration failed");
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
