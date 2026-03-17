export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  modules: ["@nuxt/ui", "@nuxtjs/tailwindcss", "@vueuse/nuxt", "@pinia/nuxt"],

  colorMode: {
    preference: "system",
    fallback: "light",
    storageKey: "color-mode",
    storage: "cookie",
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || "default-secret-change-me",
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    public: {
      siteName: process.env.SITE_NAME || "Vigil",
      apiBaseUrl: process.env.API_BASE_URL || "/api",
    },
  },

  compatibilityDate: "2025-02-19",
});
