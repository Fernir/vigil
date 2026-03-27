import { defineNuxtPlugin, useCookie } from '#app';

export default defineNuxtPlugin(() => {
  const colorMode = useColorMode();
  const cookie = useCookie('color-mode', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });

  // Prefer the persisted cookie on server and client during initial setup
  if (cookie.value && colorMode.value !== cookie.value) {
    colorMode.preference = cookie.value as 'light' | 'dark' | 'system';
  }

  // When the color mode changes, keep the cookie in sync
  watchEffect(() => {
    cookie.value = colorMode.value;
  });
});
