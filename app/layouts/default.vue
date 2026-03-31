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
      <div class="p-4">
        <h3 class="text-lg font-bold">{{ confirm.config.value.title }}</h3>
        <p class="text-gray-500 mt-2">{{ confirm.config.value.description }}</p>
        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="confirm.cancel">Cancel</UButton>
          <UButton color="red" @click="confirm.confirm">
            {{ confirm.config.value.confirmText }}
          </UButton>
        </div>
      </div>
    </UCard>
  </UModal>
</template>
