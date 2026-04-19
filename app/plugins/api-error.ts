import { toast } from "vue-sonner";

export default defineNuxtPlugin(() => {
  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) return;

      const message = response._data?.message || "Something went wrong";

      if (response.status >= 500) {
        toast.error("Server error", { description: message });
      } else if (response.status >= 400) {
        toast.warning("Error", { description: message });
      }
    },
  });
});
