<script setup lang="ts">
const confirm = useConfirm();

function onOpenChange(open: boolean) {
  if (!open) confirm.cancel();
}
</script>

<template>
  <Dialog :open="confirm.isOpen.value" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ confirm.config.value.title }}</DialogTitle>
        <DialogDescription>{{ confirm.config.value.description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" type="button" @click="confirm.cancel"> Cancel </Button>
        <Button variant="destructive" type="button" @click="confirm.confirm">
          {{ confirm.config.value.confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
