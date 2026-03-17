import { defineNuxtPlugin } from "#app";
import { useCookie } from "#app";

export default defineNuxtPlugin(() => {
  // Устанавливаем долгоживущую куку при старте клиента
  const colorMode = useColorMode();
  const cookie = useCookie("color-mode", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  // При изменении темы обновляем куку
  watchEffect(() => {
    cookie.value = colorMode.value;
  });
});
