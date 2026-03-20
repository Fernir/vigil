export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: false },

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

  app: {
    head: {
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  compatibilityDate: "2025-02-19",
});
