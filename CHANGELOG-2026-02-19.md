# Changelog — 2026-02-19

## Features

### Video Support for Sections (PR #13)
- Sections can now include an optional embedded video
- Videos are rendered inline within the lesson detail view

### Assessment Types with Local Storage (PR #14)
- New assessment types: free-text input, multiple-choice, and single-select
- Answers are stored locally in `localStorage` and persist across sessions
- Validation logic for each type (exact match, correct options)

### Coach Answer Forwarding (PR #15)
- Assessment answers can be forwarded to a workshop coach's server
- Requires explicit user consent via a toggle in Settings
- Optional user identification (name or email)

### Showcase Workshop (PR #16)
- Added a showcase workshop with fun facts and feedback examples
- Demonstrates the platform's features for new users

### Batch Coach Forwarding & Reference Server (PR #17)
- Answers are queued and sent as a single batch request instead of one-by-one
- Includes `sendBeacon` fallback for page/tab close
- Reference coach server implementation for workshop hosts

### Per-Topic Export/Import of User Data (PR #18)
- Export and import learning progress and assessment answers from the Settings page
- Scoped per topic — users select which workshop to export
- Import merges additively into existing data (no data is lost)
- Download as JSON file: `open-learn-{topic}-{date}.json`
