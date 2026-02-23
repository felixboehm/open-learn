<script setup>
import { computed } from 'vue'
import { CheckboxRoot, CheckboxIndicator } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: String, default: '' },
  checked: { type: [Boolean, String], default: false },
  disabled: { type: Boolean, default: false },
  id: { type: String, default: undefined },
})

const emit = defineEmits(['update:checked'])

const modelValue = computed({
  get: () => props.checked,
  set: (val) => emit('update:checked', val),
})
</script>

<template>
  <CheckboxRoot
    v-model:checked="modelValue"
    :disabled="disabled"
    :id="id"
    :class="cn('peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', props.class)">
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
