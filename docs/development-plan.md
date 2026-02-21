# Development Plan

## Overview

This plan covers documentation improvements, bug fixes, and code quality improvements for the Open Learn project. It was created after a comprehensive code audit in February 2026.

**Last updated**: 2026-02-21

---

## Completed Work

### PR #32 — Documentation, Bug Fixes, Security, Accessibility

#### Documentation (Reza Onboarding)
- [x] `docs/features.md` — comprehensive feature inventory
- [x] `docs/adr/` — 7 Architecture Decision Records (frontend-only, localStorage, YAML, hash routing, singleton pattern, coach external, keep-it-simple)
- [x] `CLAUDE.md` — added useAssessments, coach system, `/add` route, terminology, settings
- [x] `README.md` — updated features list (assessments, coach, export/import, workshops)

#### Bug Fixes
- [x] MC checkmark lost on reload — `isAssessmentCorrect()` now falls back to `getSubmission()?.correct`
- [x] `@click.native` Vue 2 syntax — replaced with `@click` (2 occurrences in LessonDetail.vue)

#### Security
- [x] DOMPurify sanitization for `v-html="marked(section.explanation)"` (remote lesson XSS protection)

#### Accessibility
- [x] `aria-label` on all emoji buttons in `App.vue` and `LessonDetail.vue`

### PR #33 — Unit Test Coverage

- [x] `tests/progress.test.js` — 22 tests (toggle, areAllItemsLearned, load, merge, localStorage)
- [x] `tests/lessons.test.js` — 24 tests (content sources CRUD, topic resolution, codes, YAML loading)
- [x] `tests/audio.test.js` — 18 tests (initial state, play/pause/stop, queue building, audio URLs)
- [x] `tests/formatters.test.js` — 6 tests (formatLangName with known names, URLs, hyphens)
- Total: **26 → 96 unit tests**

---

## Remaining Work

### Test Coverage Gaps

| File | Coverage | Priority | Notes |
|------|----------|----------|-------|
| useProgress.js | ~90% | Done | PR #33 |
| useLessons.js | ~70% | Done | PR #33 — remote source loading untested |
| useAudio.js | ~60% | Done | PR #33 — playback flow partially tested |
| formatters.js | ~100% | Done | PR #33 |
| useSettings.js | ~30% | Low | Only dark-mode toggle tested |
| useAssessments.js | ~60% | Medium | Validation + persistence tested, coach queue tested |
| LessonDetail.vue | 0% | Medium | Component tests not yet written |
| E2E assessment flow | 0% | Medium | No E2E for click-to-save assessment UX |

### Code Quality (nice-to-have)

- [ ] localStorage quota handling (try/catch around setItem)
- [ ] Cross-tab sync for progress/settings (storage event listener)
- [ ] Mobile keyboard blur issue on input assessments

---

## Future Work (GitHub Issues)

| Issue | Title | Priority |
|-------|-------|----------|
| #26 | New Design (shadcn-vue migration) | Medium |
| #27 | Store Progress (GunDB/SEA distributed sync) | High |
| #28 | Service Agent as Coach (intelligent-web) | Medium |
| #29 | Assessment Results button in top nav | Low |
| #30 | Result Page improvements (sent tracking, change detection) | Medium |
| #31 | Enable/fix section videos (local + YouTube) | Low |
