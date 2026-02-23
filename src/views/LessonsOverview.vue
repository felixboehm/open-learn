<template>
  <div>
    <!-- Source indicator for remote topics -->
    <div v-if="!isLoading && isRemote" class="mb-4 flex items-center justify-between text-sm">
      <div>
        <span v-if="topicDescription" class="text-muted-foreground">{{ topicDescription }}</span>
        <span v-if="topicDescription && sourceLabel" class="text-muted-foreground/40 mx-2">·</span>
        <span v-if="sourceLabel" class="text-muted-foreground/60">{{ sourceLabel }}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="copyShareLink">
        {{ copied ? 'Copied!' : 'Share' }}
      </Button>
    </div>

    <!-- Lessons grid -->
    <div v-if="!isLoading && lessons.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card
        v-for="lesson in lessons"
        :key="lesson.number"
        @click="openLesson(lesson.number)"
        class="p-6 cursor-pointer transition hover:-translate-y-1 hover:shadow-xl">
        <div class="text-6xl font-bold opacity-20 text-primary">
          {{ lesson.number }}
        </div>
        <div class="text-2xl font-semibold my-2 text-foreground">
          {{ lesson.title }}
        </div>
        <div class="text-muted-foreground mb-2">
          {{ lesson.description || '' }}
        </div>
        <div class="text-primary font-semibold">
          {{ lesson.sections.length }} sections
        </div>
      </Card>
    </div>

    <!-- Assessment results link -->
    <div v-if="!isLoading && lessons.length > 0" class="mt-6">
      <router-link
        :to="`/${learning}/${teaching}/results`">
        <Button variant="secondary">
          Assessment Results
        </Button>
      </router-link>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div class="text-2xl font-bold text-primary mb-4">
        Loading lessons...
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <div class="text-xl text-muted-foreground">
        No lessons found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForTopic, isRemoteTopic, getSourceForSlug, getTopicMeta } = useLessons()

const lessons = ref([])
const isLoading = ref(true)
const copied = ref(false)

const learning = computed(() => route.params.learning)
const teaching = computed(() => route.params.teaching)

const isRemote = computed(() => isRemoteTopic(teaching.value))
const topicDescription = computed(() => {
  const meta = getTopicMeta(learning.value, teaching.value)
  return meta.description || null
})
const sourceLabel = computed(() => {
  const url = getSourceForSlug(teaching.value)
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/index\.yaml$/, '')
    return u.hostname + path
  } catch { return '' }
})

async function copyShareLink() {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${learning.value}/${teaching.value}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

function openLesson(number) {
  router.push({
    name: 'lesson-detail',
    params: {
      learning: learning.value,
      teaching: teaching.value,
      number
    }
  })
}

async function loadLessons() {
  if (!learning.value || !teaching.value) return

  isLoading.value = true
  lessons.value = await loadAllLessonsForTopic(learning.value, teaching.value)
  isLoading.value = false

  // Update page title with topic name
  const meta = getTopicMeta(learning.value, teaching.value)
  emit('update-title', meta.title || formatLangName(teaching.value))
}

// Watch for route changes and reload lessons
watch([learning, teaching], () => {
  loadLessons()
}, { immediate: true })
</script>
