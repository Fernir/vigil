import { ref, computed } from "vue";
import { navigateTo } from "#app";

interface User {
  id: number;
  email: string;
  telegramChatId?: string;
}

interface LoginResponse {
  user: User;
  token?: string;
}

interface SessionResponse {
  user: User | null;
}

const sessionLoaded = ref(false);
const user = ref<User | null>(null);
const token = ref<string | null>(null);

export const useUserSession = () => {
  const fetchSession = async () => {
    if (!process.client) return;

    sessionLoaded.value = false;

    try {
      const session = await $fetch<SessionResponse>("/api/auth/session");
      user.value = session?.user || null;
    } catch (e) {
      console.error("❌ Failed to fetch session", e);
      user.value = null;
    } finally {
      sessionLoaded.value = true;
    }
  };

  if (process.client) {
    fetchSession();
  }

  const loggedIn = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (response?.user) {
        user.value = response.user;
        token.value = response.token || null;
        return { success: true };
      }
      return { success: false, error: "No data received" };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        error: error.data?.message || error.message || "Login failed",
      };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: { email, password },
      });
      return { success: true };
    } catch (error: any) {
      console.error("❌ Register error:", error);
      return {
        success: false,
        error: error.data?.message || error.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    user.value = null;
    token.value = null;
    await navigateTo("/auth/login");
  };

  return {
    user,
    token,
    loggedIn,
    sessionLoaded,
    login,
    register,
    logout,
    fetchSession,
  };
};
