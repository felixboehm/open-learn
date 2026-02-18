# Lessons

This directory contains learning content in YAML format for the Open Learn platform. Lessons are organized in a two-level hierarchy based on interface language and topic.

## Directory Structure

```
lessons/
├── README.md
├── workshop.yaml              # Root index
├── deutsch/                    # Learning in German
│   ├── topics.yaml
│   ├── portugiesisch/         # Teaching Portuguese
│   │   ├── lessons.yaml
│   │   ├── 01-essential-verbs/
│   │   │   ├── content.yaml
│   │   │   └── audio/
│   │   └── ...
│   └── englisch/              # Teaching English
│       ├── lessons.yaml
│       └── 01-greetings/
│           ├── content.yaml
│           └── audio/
├── english/                    # Learning in English
│   ├── topics.yaml
│   └── german/
│       ├── lessons.yaml
│       └── ...
└── [interface-language]/
    └── [topic]/
```

## Folder Structure

Lessons use a **two-level folder hierarchy**:

1. **First level** (`learning`): The language you're learning **in** (interface language)
   - Examples: `deutsch`, `english`, `spanish`

2. **Second level** (`teaching`): The topic being **taught**
   - Language topics: `portugiesisch`, `englisch`, `german`
   - Other topics: `math-algebra`, `driver-license`

### Examples:

- `lessons/deutsch/portugiesisch/` - Learn Portuguese with German explanations
- `lessons/deutsch/englisch/` - Learn English with German explanations
- `lessons/english/german/` - Learn German with English explanations
- `lessons/english/math-algebra/` - Learn math/algebra in English
- `lessons/english/driver-license/` - Driver's license materials in English

This structure allows the same content to be presented from different linguistic perspectives or to teach non-language topics.

## Currently Available:

- **deutsch/portugiesisch/** - Portuguese lessons with German interface
  - 10 lessons covering essential verbs through advanced concepts

- **deutsch/englisch/** - English lessons with German interface
  - 1 lesson: greetings and introductions

- **english/german/** - German lessons with English interface
  - 1 lesson: greetings and introductions

## Adding New Lessons

To add lessons for a new topic:

1. Create the folder structure: `lessons/<learning>/<teaching>/`
2. Create `lessons.yaml` listing the lesson folders
3. Add lesson folders with `content.yaml` following the schema (see `docs/lesson-schema.md`)
4. Optionally add `audio/` subfolders with MP3 files

## Lesson File Format

All lessons follow the YAML schema documented in `/docs/lesson-schema.md`. Key elements:

- **number**: Lesson number (integer)
- **title**: Lesson title
- **description**: Brief description of the lesson
- **sections**: Array of learning sections
  - **title**: Section title
  - **explanation**: Optional markdown explanation
  - **examples**: Array of Q&A examples
    - **q**: Question/source content
    - **a**: Answer/target content
    - **labels**: Optional array of labels
    - **rel**: Related items (vocabulary, concepts)

## See Also

- `/docs/lesson-schema.md` - Complete schema documentation with examples
- `/docs/yaml-schemas.md` - Index file schemas (languages, topics, lessons)
- `/docs/audio-system.md` - Audio generation and playback
