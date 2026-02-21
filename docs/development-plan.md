# Development Plan

## Overview

This plan covers documentation improvements, bug fixes, and code quality improvements for the Open Learn project. It was created after a comprehensive code audit in February 2026.

---

## Priority 1: Documentation (Reza Onboarding)

### 1.1 Feature List (`docs/features.md`)
Comprehensive inventory of all features with status, location, and description. Allows Reza (and future contributors) to quickly see what exists.

### 1.2 Architecture Decision Records (`docs/adr/`)
Document key decisions that shaped the project:
- Frontend-only, no backend
- localStorage for persistence
- YAML for content
- Hash-based routing for GitHub Pages
- Composable singleton pattern
- Coach as optional external service

### 1.3 Update CLAUDE.md
Missing from current documentation:
- `useAssessments.js` composable (not mentioned at all)
- Click-to-save assessment behavior
- Coach system overview
- Route `/add` (AddSource)
- Settings: `coachConsent`, `coachIdentifier`
- Terminology: Workshop vs Topic vs Lesson

### 1.4 Update README.md
Add to features list:
- Assessment system (input, multiple-choice, select)
- Coach answer forwarding
- Export/Import user data
- Click-to-save auto-validation

---

## Priority 2: Bug Fixes

### 2.1 MC Checkmark Lost on Reload
**File**: `src/views/LessonDetail.vue`
**Bug**: `isAssessmentCorrect()` for multiple-choice only checks `mcLive` (in-memory reactive object), not the persisted submission in localStorage. After page reload, `mcLive` is empty, so the green checkmark and card styling disappear.
**Fix**: Also check `getSubmission(example)?.correct` as fallback.

### 2.2 `@click.native` Vue 2 Syntax
**File**: `src/views/LessonDetail.vue`
**Bug**: `@click.native="flushOnLeave"` on `<router-link>` is Vue 2 syntax. Vue 3 emits native events by default — `.native` modifier is silently ignored, meaning `flushOnLeave` never fires.
**Fix**: Replace with `@click="flushOnLeave"`.

---

## Priority 3: Security

### 3.1 Sanitize Markdown Output
**File**: `src/views/LessonDetail.vue`
**Risk**: `v-html="marked(section.explanation)"` renders unsanitized HTML. Remote lessons could inject scripts.
**Fix**: Add DOMPurify: `v-html="DOMPurify.sanitize(marked(section.explanation))"`.

---

## Priority 4: Accessibility

### 4.1 Aria Labels for Emoji Buttons
**File**: `src/App.vue`, `src/views/LessonDetail.vue`
**Issue**: Buttons with emoji-only text (🏠, ←, ▶️, ⏸, ⚙️, ✓) are not screen-reader accessible.
**Fix**: Add `aria-label` to each button.

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

## Test Coverage Gaps (for future improvement)

| File | Current Coverage | Priority |
|------|-----------------|----------|
| useProgress.js | 0% | High — simple, good first task |
| useLessons.js | 0% | High — core content loading |
| useAudio.js | 0% | Medium — complex, 727 lines |
| LessonDetail.vue | 0% | Medium — main user flow |
| E2E assessment flow | 0% | High — critical path |
