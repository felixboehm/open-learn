# Development Plan

**Last updated**: 2026-02-21

---

## Test Coverage

| File | Coverage | Priority | Notes |
|------|----------|----------|-------|
| useSettings.js | ~30% | Low | Only dark-mode toggle tested |
| useAssessments.js | ~60% | Medium | Validation + persistence tested, coach queue tested |
| LessonDetail.vue | 0% | Medium | Component tests not yet written |
| E2E assessment flow | 0% | Medium | No E2E for click-to-save assessment UX |

## Code Quality

- [ ] localStorage quota handling (try/catch around setItem)
- [ ] Cross-tab sync for progress/settings (storage event listener)
- [ ] Mobile keyboard blur issue on input assessments
