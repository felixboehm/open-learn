import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");

interface Answer {
  section: { index: number; title?: string };
  example: { index: number; type: string; question: string };
  answer: { value: string | number | number[]; correct: boolean | null };
}

interface AnswerBatch {
  lesson: {
    learning: string;
    teaching: string;
    number: number;
    title: string;
  };
  answers: Answer[];
  user?: string;
  timestamp: string;
}

function sanitizePath(str: string): string {
  return str.replace(/[^a-zA-Z0-9._@-]/g, "_");
}

function formatTimestamp(iso: string): string {
  return iso.replace(/[:.]/g, "-").replace("T", "_").replace("Z", "");
}

function formatAnswerValue(value: string | number | number[]): string {
  if (Array.isArray(value)) {
    return value.map((v) => `Option ${v}`).join(", ");
  }
  if (typeof value === "number") {
    return `Option ${value}`;
  }
  return value;
}

function renderMarkdown(batch: AnswerBatch): string {
  const lines: string[] = [];

  lines.push(`# ${batch.lesson.title}`);
  lines.push("");
  lines.push(`- **Workshop:** ${batch.lesson.learning} / ${batch.lesson.teaching}`);
  lines.push(`- **Lesson:** ${batch.lesson.number}`);
  lines.push(`- **User:** ${batch.user || "anonymous"}`);
  lines.push(`- **Submitted:** ${batch.timestamp}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Group answers by section
  const bySection = new Map<number, Answer[]>();
  for (const answer of batch.answers) {
    const sIdx = answer.section.index;
    if (!bySection.has(sIdx)) {
      bySection.set(sIdx, []);
    }
    bySection.get(sIdx)!.push(answer);
  }

  for (const [sectionIdx, answers] of bySection) {
    const sectionTitle = answers[0]?.section.title || `Section ${sectionIdx + 1}`;
    lines.push(`## ${sectionTitle}`);
    lines.push("");

    for (const answer of answers) {
      lines.push(`**${answer.example.question}**`);
      lines.push("");
      lines.push(`> ${formatAnswerValue(answer.answer.value)}`);
      lines.push("");

      if (answer.answer.correct === true) {
        lines.push("*Correct*");
      } else if (answer.answer.correct === false) {
        lines.push("*Incorrect*");
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Write a batch of answers to a Markdown file.
 *
 * File structure:
 *   data/{workshopId}/{userId}/{timestamp}.md
 *
 * Also maintains a summary index per user:
 *   data/{workshopId}/{userId}/index.md
 */
export function writeAnswersToMarkdown(
  workshopId: string,
  userId: string,
  batch: AnswerBatch
): string {
  const safeWorkshop = sanitizePath(workshopId);
  const safeUser = sanitizePath(userId);
  const dir = join(DATA_DIR, safeWorkshop, safeUser);

  mkdirSync(dir, { recursive: true });

  // Write individual submission
  const filename = `${formatTimestamp(batch.timestamp)}.md`;
  const filePath = join(dir, filename);
  const markdown = renderMarkdown(batch);
  writeFileSync(filePath, markdown, "utf-8");

  // Update user index
  updateUserIndex(dir, safeUser, batch, filename);

  return filePath;
}

function updateUserIndex(
  dir: string,
  userId: string,
  batch: AnswerBatch,
  filename: string
): void {
  const indexPath = join(dir, "index.md");
  let content = "";

  if (existsSync(indexPath)) {
    content = readFileSync(indexPath, "utf-8");
  } else {
    content = `# Submissions: ${userId}\n\n`;
  }

  const entry = `- **${batch.timestamp}** — Lesson ${batch.lesson.number}: ${batch.lesson.title} (${batch.answers.length} answers) → [${filename}](./${filename})\n`;
  content += entry;

  writeFileSync(indexPath, content, "utf-8");
}
