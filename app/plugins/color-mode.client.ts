import { defineNuxtPlugin, useCookie } from '#app';

export default defineNuxtPlugin(() => {
  const colorMode = useColorMode();

  const cookie = useCookie('color-mode', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });

  if (cookie.value && colorMode.value !== cookie.value) {
    colorMode.preference = cookie.value as 'light' | 'dark' | 'system';
  }

  watchEffect(() => {
    cookie.value = colorMode.value;
  });
});
