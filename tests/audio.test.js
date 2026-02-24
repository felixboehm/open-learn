import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock useLessons and useProgress before importing useAudio
vi.mock('../src/composables/useLessons', () => ({
  useLessons: () => ({
    getLanguageCode: () => null,
    getTopicCode: () => null,
    resolveWorkshopKey: (key) => key
  })
}))

vi.mock('../src/composables/useProgress', () => ({
  useProgress: () => ({
    areAllItemsLearned: () => false
  })
}))

// Mock Audio constructor to resolve immediately
class MockAudio {
  constructor() {
    this.preload = ''
    this.src = ''
    this.currentTime = 0
    this.playbackRate = 1
    this._handlers = {}
  }
  addEventListener(event, handler, opts) {
    this._handlers[event] = handler
    // Auto-fire canplaythrough
    if (event === 'canplaythrough') {
      setTimeout(() => handler(), 0)
    }
  }
  load() {}
  play() { return Promise.resolve() }
  pause() {}
}
globalThis.Audio = MockAudio

const { useAudio } = await import('../src/composables/useAudio')

describe('useAudio', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.cleanup()
  })

  describe('initial state', () => {
    it('starts not playing', () => {
      expect(audio.isPlaying.value).toBe(false)
    })

    it('starts not paused', () => {
      expect(audio.isPaused.value).toBe(false)
    })

    it('has no current item', () => {
      expect(audio.currentItem.value).toBeNull()
    })

    it('has empty reading queue', () => {
      expect(audio.readingQueue.value).toEqual([])
    })

    it('starts at index -1', () => {
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('play', () => {
    it('does nothing with empty queue', () => {
      audio.play({ readAnswers: true })
      expect(audio.isPlaying.value).toBe(false)
    })
  })

  describe('pause', () => {
    it('sets paused state', () => {
      audio.pause()
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.isPaused.value).toBe(true)
    })
  })

  describe('stop', () => {
    it('resets all state', () => {
      audio.stop()
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.isPaused.value).toBe(false)
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('cleanup', () => {
    it('resets queue and state', () => {
      audio.cleanup()
      expect(audio.readingQueue.value).toEqual([])
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('skipToNext', () => {
    it('does nothing at end of queue', () => {
      audio.skipToNext({ readAnswers: true })
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('skipToPrevious', () => {
    it('does nothing at start of queue', () => {
      audio.skipToPrevious({ readAnswers: true })
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })
})

describe('initializeAudio and queue building', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.cleanup()
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }

  it('builds queue from lesson with sections and examples', async () => {
    const lesson = {
      title: 'Test Lesson',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'Section 1',
        examples: [
          { q: 'Question 1', a: 'Answer 1' },
          { q: 'Question 2', a: 'Answer 2' }
        ]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    expect(queue.length).toBe(6) // title + section-title + 2*(q+a)

    expect(queue[0].type).toBe('lesson-title')
    expect(queue[0].text).toBe('Test Lesson')
    expect(queue[1].type).toBe('section-title')
    expect(queue[1].text).toBe('Section 1')
    expect(queue[2].type).toBe('question')
    expect(queue[2].text).toBe('Question 1')
    expect(queue[3].type).toBe('answer')
    expect(queue[3].text).toBe('Answer 1')
    expect(queue[4].type).toBe('question')
    expect(queue[4].text).toBe('Question 2')
    expect(queue[5].type).toBe('answer')
    expect(queue[5].text).toBe('Answer 2')
  })

  it('excludes answers when readAnswers is false', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'S1',
        examples: [{ q: 'Q1', a: 'A1' }]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', { ...settings, readAnswers: false })

    const answerItems = audio.readingQueue.value.filter(item => item.type === 'answer')
    expect(answerItems.length).toBe(0)
  })

  it('handles lesson without sections', async () => {
    await audio.initializeAudio(
      { title: 'Empty', number: 1, _filename: '01-empty' },
      'de', 'pt', settings
    )

    const queue = audio.readingQueue.value
    expect(queue.length).toBe(0) // buildReadingQueue returns [] for no sections
  })

  it('sets correct audio URLs', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'S1',
        examples: [{ q: 'Q1', a: 'A1' }]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    expect(queue[0].audioUrl).toContain('title.mp3')
    expect(queue[1].audioUrl).toContain('0-title.mp3')
    expect(queue[2].audioUrl).toContain('0-0-q.mp3')
    expect(queue[3].audioUrl).toContain('0-0-a.mp3')
  })

  it('tracks section and example indices', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [
        { title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] },
        { title: 'S2', examples: [{ q: 'Q2', a: 'A2' }] }
      ]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    expect(queue[0].sectionIdx).toBe(-1) // lesson title
    expect(queue[1].sectionIdx).toBe(0) // section 1 title
    expect(queue[1].exampleIdx).toBe(-1)
    expect(queue[2].sectionIdx).toBe(0) // Q1
    expect(queue[2].exampleIdx).toBe(0)
    expect(queue[4].sectionIdx).toBe(1) // section 2 title
    expect(queue[5].sectionIdx).toBe(1) // Q2
    expect(queue[5].exampleIdx).toBe(0)
  })

  it('resets playback state after init', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    expect(audio.isPlaying.value).toBe(false)
    expect(audio.isPaused.value).toBe(false)
    expect(audio.currentItemIndex.value).toBe(-1)
  })

  it('handles examples without answers', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'S1',
        examples: [{ q: 'Question only' }] // no 'a' field
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    const answerItems = queue.filter(item => item.type === 'answer')
    expect(answerItems.length).toBe(0)
  })
})
