# Open Learn Coach Server

Reference implementation of a coach server that receives assessment answers from Open Learn workshops and stores them as structured Markdown files.

## Quick Start

```bash
cd examples/coach-server
npm install
npm run dev
```

The server starts at `http://localhost:3001`.

## Configure Your Workshop

Add the coach API to your lesson's `content.yaml`:

```yaml
version: 2
title: "My Workshop"
coach:
  api: "http://localhost:3001/api/answers"
  name: "Workshop Coach"
sections:
  # ...
```

Users need to enable "Share Answers with Coach" in Open Learn Settings.

## How It Works

1. Users answer assessment questions in Open Learn
2. Answers are collected in a batch (not sent individually)
3. The batch is sent when the user clicks "Send Answers to Coach", navigates away, or closes the tab
4. This server receives the batch and writes a Markdown file

## File Structure

```
data/
├── english-open-learn-showcase/     # Workshop ID
│   ├── anonymous/                    # User ID (or email)
│   │   ├── index.md                  # Summary of all submissions
│   │   ├── 2026-02-19_10-30-00.md   # Individual submission
│   │   └── 2026-02-19_11-00-00.md
│   └── user@example.com/
│       ├── index.md
│       └── 2026-02-19_10-45-00.md
```

Each submission is a readable Markdown file:

```markdown
# Open Learn Feedback

- **Workshop:** english / open-learn-showcase
- **Lesson:** 3
- **User:** user@example.com
- **Submitted:** 2026-02-19T10:30:00.000Z

---

## First Impressions

**How did you discover Open Learn?**

> GitHub

**What is your overall first impression?**

> Looks great, I want to use it!
```

## API

### `POST /api/answers`

Receives a batch of answers.

**Request body:**

```json
{
  "lesson": {
    "learning": "english",
    "teaching": "open-learn-showcase",
    "number": 3,
    "title": "Open Learn Feedback"
  },
  "answers": [
    {
      "section": { "index": 0, "title": "First Impressions" },
      "example": { "index": 0, "type": "select", "question": "How did you discover Open Learn?" },
      "answer": { "value": 0, "correct": null }
    }
  ],
  "user": "optional@email.com",
  "timestamp": "2026-02-19T10:30:00.000Z"
}
```

**Response:**

```json
{ "ok": true, "count": 1 }
```

**Error responses:**
- `400` — Invalid payload
- `401` — Unauthorized (implement your own auth logic)
- `500` — Storage error
