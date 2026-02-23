<script setup>
import { RadioGroupItem, RadioGroupIndicator } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: '' },
  value: { type: String, required: true },
  id: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <RadioGroupItem
    :value="value"
    :id="id"
    :disabled="disabled"
    :class="cn('aspect-square h-4 w-4 rounded-full border border-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)">
    <RadioGroupIndicator class="flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
