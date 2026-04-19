<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  SwitchRoot,
  SwitchThumb,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<SwitchRootProps & {
  class?: HTMLAttributes['class']
  size?: 'sm' | 'default'
}>(), {
  size: 'default',
})

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'size')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-slot="slotProps"
    data-slot="switch"
    :data-size="size"
    v-bind="forwarded"
    :class="cn(
      'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-input bg-muted/50 shadow-inner transition-all outline-none',
      'data-[state=checked]:border-primary/40 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
      'dark:data-[state=unchecked]:bg-input/80 dark:data-[state=checked]:bg-primary',
      'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
      'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 aria-invalid:ring-[3px]',
      'data-[size=default]:h-[22px] data-[size=default]:min-w-[40px] data-[size=sm]:h-[18px] data-[size=sm]:min-w-[32px]',
      'after:absolute after:-inset-x-3 after:-inset-y-2',
      'data-disabled:cursor-not-allowed data-disabled:opacity-50',
      props.class,
    )"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn(
        'pointer-events-none block rounded-full bg-background shadow-sm ring-1 ring-border transition-transform',
        'group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3',
        'group-data-[state=checked]/switch:translate-x-[calc(100%-2px)] group-data-[state=unchecked]/switch:translate-x-[3px]',
        'dark:group-data-[state=unchecked]/switch:bg-muted dark:group-data-[state=checked]/switch:bg-primary-foreground',
      )"
    >
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
