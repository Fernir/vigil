export default defineNuxtPlugin(() => {
  const toast = useToast();

  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ response }) {
      if (response.status >= 500) {
        toast.add({
          title: 'Server error',
          description: response._data?.message || 'Something went wrong',
          color: 'red',
        });
      } else if (response.status === 401) {
        // Ignore auth checks here (middleware handles redirects)
        return;
      } else if (response.status >= 400) {
        toast.add({
          title: 'Error',
          description: response._data?.message || 'Request failed',
          color: 'yellow',
        });
      }
    },
  });
});
