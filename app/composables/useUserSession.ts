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

const user = ref<User | null>(null);
const token = ref<string | null>(null);

export const useUserSession = () => {
  // Проверяем сессию на сервере при загрузке
  const fetchSession = async () => {
    if (process.client) {
      try {
        // $fetch возвращает сразу данные, а не { data }
        const session = await $fetch<SessionResponse>("/api/auth/session");

        if (session?.user) {
          user.value = session.user;
        } else {
          user.value = null;
        }
      } catch (e) {
        console.error("❌ Failed to fetch session", e);
        user.value = null;
      }
    }
  };

  // Загружаем сессию при инициализации
  if (process.client) {
    fetchSession();
  }

  const loggedIn = computed(() => {
    const isLoggedIn = !!user.value;

    return isLoggedIn;
  });

  const login = async (email: string, password: string) => {
    try {
      // $fetch возвращает сразу данные
      const response = await $fetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (response?.user) {
        user.value = response.user;
        token.value = response.token || null;

        // Сохраняем в sessionStorage как запасной вариант
        if (process.client) {
          sessionStorage.setItem("user_email", response.user.email);
          sessionStorage.setItem("user_id", String(response.user.id));
        }

        return { success: true };
      }

      return {
        success: false,
        error: "No data received",
      };
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

    if (process.client) {
      sessionStorage.removeItem("user_email");
      sessionStorage.removeItem("user_id");
    }

    navigateTo("/auth/login");
  };

  // Восстанавливаем сессию из sessionStorage если нужно
  const restoreSession = () => {
    if (process.client) {
      const userId = sessionStorage.getItem("user_id");
      const userEmail = sessionStorage.getItem("user_email");

      if (userId && userEmail && !user.value) {
        user.value = {
          id: parseInt(userId),
          email: userEmail,
        };
      }
    }
  };

  // Вызываем восстановление при инициализации
  if (process.client) {
    restoreSession();
  }

  return {
    user,
    token,
    loggedIn,
    login,
    register,
    logout,
    fetchSession, // экспортируем для возможности ручной проверки
  };
};
