<script setup>
import { RadioGroupRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: '' },
  modelValue: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <RadioGroupRoot
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :class="cn('grid gap-2', props.class)">
    <slot />
  </RadioGroupRoot>
</template>
