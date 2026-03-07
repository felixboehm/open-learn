import { ref } from 'vue'

// Shared reactive state for lesson-specific footer buttons
const nextLessonNumber = ref(null)
const lessonLearning = ref(null)
const lessonWorkshop = ref(null)

function setLessonFooter(learning, workshop, nextNumber) {
  lessonLearning.value = learning
  lessonWorkshop.value = workshop
  nextLessonNumber.value = nextNumber
}

function clearLessonFooter() {
  nextLessonNumber.value = null
  lessonLearning.value = null
  lessonWorkshop.value = null
}

export function useFooter() {
  return {
    nextLessonNumber,
    lessonLearning,
    lessonWorkshop,
    setLessonFooter,
    clearLessonFooter
  }
}
