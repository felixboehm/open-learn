<script setup>
import { Label as LabelRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: '' },
  for: { type: String, default: undefined },
})
</script>

<template>
  <LabelRoot
    :for="props.for"
    :class="cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', props.class)">
    <slot />
  </LabelRoot>
</template>
