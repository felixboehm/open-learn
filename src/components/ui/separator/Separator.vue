<script setup>
import { Separator as SeparatorRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: '' },
  orientation: { type: String, default: 'horizontal' },
  decorative: { type: Boolean, default: true },
})
</script>

<template>
  <SeparatorRoot
    :orientation="orientation"
    :decorative="decorative"
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      props.class
    )" />
</template>
