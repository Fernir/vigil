import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  alias: {
    "@": fileURLToPath(new URL("./app", import.meta.url)),
  },

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: false },

  modules: [
    "shadcn-nuxt",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxt/image",
  ],

  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },

  colorMode: {
    preference: "system",
    fallback: "dark",
    storageKey: "color-mode",
    storage: "cookie",
    classSuffix: "",
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || "default-secret-change-me",
    public: {
      siteName: process.env.SITE_NAME || "Vigil",
      apiBaseUrl: process.env.API_BASE_URL || "/api",
    },
  },

  app: {
    head: {
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    },
  },

  compatibilityDate: "2025-02-19",
});
