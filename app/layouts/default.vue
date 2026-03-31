<script setup lang="ts">
useColorMode();
const confirm = useConfirm();
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </div>

  <UModal v-model="confirm.isOpen.value">
    <UCard>
      <template #header>{{ confirm.config.value.title }}</template>
      <p class="text-gray-500 mt-2">{{ confirm.config.value.description }}</p>
      <template #footer>
        <div class="flex justify-end gap-4">
          <UButton color="gray" variant="ghost" @click="confirm.cancel">Cancel</UButton>
          <UButton color="red" @click="confirm.confirm">
            {{ confirm.config.value.confirmText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
