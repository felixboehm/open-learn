# Navigation & Page Structure

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Home** | `/` | Marketing/intro page with features, how it works, roadmap. Language selector inline. |
| **Workshop Overview** | `/:learning/workshops` | Workshop cards for the selected language. Language dropdown in navbar. |
| **Lessons Overview** | `/:learning/:workshop/lessons` | Lesson cards grid for a specific workshop. |
| **Lesson Detail** | `/:learning/:workshop/lesson/:number` | Individual lesson with sections, assessments, audio. |
| **Learning Items** | `/:learning/:workshop/items/:number?` | Vocabulary/concept browser. Optional lesson filter. |
| **Assessment Results** | `/:learning/:workshop/results` | Performance overview for a workshop. |
| **Coach** | `/:learning/:workshop/coach` | External coach interaction (if configured). |
| **Settings** | `/settings` | App preferences, data export/import, GunDB sync. |
| **Add Source** | `/add?source=URL` | Add external workshop by URL. |

## Navigation Flow

```
Home (/)
  └── [click language button]
      └── Workshop Overview (/:learning/workshops)
          └── [click workshop card]
              └── Lessons Overview (/:learning/:workshop/lessons)
                  └── [click lesson card]
                      └── Lesson Detail (/:learning/:workshop/lesson/:number)
```

## Navbar Buttons per Page

| Page | Header | Left | Right |
|------|--------|------|-------|
| **Home** | Hidden | — | — |
| **Workshop Overview** | Visible | Language dropdown, Home | Settings |
| **Lessons Overview** | Visible | ← Workshop Overview | Settings, Items, Results |
| **Lesson Detail** | Visible | ← Lessons Overview | Settings, Play/Pause, Items, Results, Coach |
| **Learning Items** | Visible | ← Lessons Overview | Settings, Items, Results |
| **Assessment Results** | Visible | ← Lessons Overview | Settings, Items, Results |
| **Coach** | Visible | ← Lessons Overview | Settings, Items, Results, Coach |
| **Settings** | Visible | — | Done |

## Key Behaviors

- **Language selector**: Only on Home (inline buttons) and Workshop Overview (navbar dropdown)
- **Language switching** on Workshop Overview: Updates route param → `/:newLang/workshops`
- **Back navigation**: Context-aware. Lessons Overview goes back to Workshop Overview. All other workshop subpages go back to Lessons Overview.
- **Deep links**: Direct URLs like `/#/deutsch/portugiesisch/lessons` still work — no workshop overview visit required.
