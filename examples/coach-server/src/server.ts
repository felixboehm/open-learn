import express from "express";
import { writeAnswersToMarkdown } from "./storage.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Parse JSON body (including from sendBeacon which sends as blob)
app.use(express.json({ type: ["application/json", "text/plain"] }));

// CORS — allow requests from any origin (Open Learn is a static site)
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  next();
});

// Handle preflight
app.options("/api/answers", (_req, res) => {
  res.sendStatus(204);
});

// Receive batched answers
app.post("/api/answers", (req, res) => {
  const { lesson, answers, user, timestamp } = req.body;

  if (!lesson || !answers || !Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({ error: "Invalid payload: lesson and answers[] required" });
    return;
  }

  const workshopId = `${lesson.learning}-${lesson.teaching}`;
  const userId = user || "anonymous";

  try {
    const filePath = writeAnswersToMarkdown(workshopId, userId, {
      lesson,
      answers,
      user: user || undefined,
      timestamp: timestamp || new Date().toISOString(),
    });

    console.log(
      `[${new Date().toISOString()}] Received ${answers.length} answers from "${userId}" for "${lesson.title}" → ${filePath}`
    );

    res.json({ ok: true, count: answers.length });
  } catch (err) {
    console.error("Failed to write answers:", err);
    res.status(500).json({ error: "Failed to store answers" });
  }
});

// Simple dashboard: list all stored files
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <head><title>Open Learn Coach Server</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
        <h1>Open Learn Coach Server</h1>
        <p>This server receives assessment answers from Open Learn workshops.</p>
        <p>Answers are stored as Markdown files in <code>./data/</code></p>
        <h2>API</h2>
        <pre>POST /api/answers</pre>
        <p>Configure in your lesson YAML:</p>
        <pre>coach:
  api: "http://localhost:${PORT}/api/answers"
  name: "My Workshop"</pre>
        <h2>Files</h2>
        <p>Check the <code>data/</code> folder for received answers.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Coach server running at http://localhost:${PORT}`);
  console.log(`Configure in lesson YAML: coach.api = "http://localhost:${PORT}/api/answers"`);
});
