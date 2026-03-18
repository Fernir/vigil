import { defineNuxtPlugin } from "#app";
import { useCookie } from "#app";

export default defineNuxtPlugin(() => {
  // Set long-lived cookie on client-side startup
  const colorMode = useColorMode();
  const cookie = useCookie("color-mode", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  // When the color mode changes, update the cookie
  watchEffect(() => {
    cookie.value = colorMode.value;
  });
});
