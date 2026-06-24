import type { BloomLevel, LearningContent, Question } from "../schemas/index.js";

const BLOOM_DEFINITIONS: Record<BloomLevel, { def: string; verbs: string }> = {
  remember: {
    def: "Recall or recognize facts, terms, and basic concepts from memory.",
    verbs: "define, list, identify, name, recall, state",
  },
  understand: {
    def: "Explain ideas or concepts in your own words; demonstrate comprehension.",
    verbs: "explain, summarize, describe, interpret, classify, paraphrase",
  },
  apply: {
    def: "Use information in a new situation or solve a problem using learned knowledge.",
    verbs: "solve, use, demonstrate, apply, calculate, illustrate",
  },
  analyze: {
    def: "Break information into parts; find patterns, causes, or hidden meanings.",
    verbs: "analyze, differentiate, examine, distinguish, infer, break down",
  },
};

const LANG_LABELS: Record<string, string> = {
  en: "English",
  ar: "Arabic (اللغة العربية)",
};

export function buildSystemPrompt(levels: BloomLevel[]): string {
  const levelDefs = levels
    .map((l) => `${l} — ${BLOOM_DEFINITIONS[l].def}\n  Example verbs: ${BLOOM_DEFINITIONS[l].verbs}`)
    .join("\n");

  return `You are an educational question generator for K-12 students.

OUTPUT RULES (non-negotiable):
- Respond with ONLY a raw JSON array. No prose. No markdown. No code fences.
- The array must conform exactly to this schema:
  [
    {
      "id": "<any string>",
      "contentId": "<contentId from user message>",
      "bloom": "<one of: remember | understand | apply | analyze>",
      "lang": "<one of: en | ar>",
      "prompt": "<the question text>",
      "rubric": [
        { "id": "<any string>", "description": "<criterion>", "weight": <number> }
      ],
      "modelAnswer": "<model answer text>"
    }
  ]
- rubric weights per question MUST sum to exactly 1.0.
- Questions MUST be answerable solely from the provided content. Do not introduce outside facts.
- Use age-appropriate, curriculum-safe language. Avoid violence, politics, or sensitive topics.

LANGUAGE RULE:
- Write ALL text fields (prompt, rubric descriptions, modelAnswer) in the same language as the content.
- The content language is specified in the user message. If it is "ar", write in Arabic script.
- The "lang" field in each JSON object must match the content language exactly.

BLOOM'S TAXONOMY LEVELS (generate questions for the levels listed below only):
${levelDefs}`;
}

export function buildUserMessage(
  content: LearningContent,
  levels: BloomLevel[],
  count: number
): string {
  const langLabel = LANG_LABELS[content.lang] ?? content.lang;
  return `Content ID: ${content.id}
Language: ${content.lang} (${langLabel})

CONTENT:
${content.text}

TASK:
Generate ${count} question(s) PER requested Bloom level.
Requested levels: ${levels.join(", ")}
Total questions expected: ${levels.length * count}

All output text must be in ${langLabel}. Return ONLY the JSON array. Nothing else.`;
}

export function buildGradeSystemPrompt(): string {
  return `You are a K-12 educational grader. Evaluate a student's answer against a rubric.

OUTPUT RULES (non-negotiable):
- Respond with ONLY a raw JSON object. No prose. No markdown. No code fences.
- The object must conform exactly to this schema:
  {
    "perCriterion": [
      { "id": "<criterion id>", "met": true|false, "note": "<one sentence explanation>" }
    ],
    "feedback": "<encouraging, specific, student-facing feedback>",
    "misconception": "<string describing the conceptual gap, or null if mostly correct>"
  }

GRADING RULES:
- Evaluate each criterion independently based solely on the student's answer.
- The criterion ids in perCriterion MUST exactly match the ids given in the rubric.
- note: one sentence explaining why the criterion is met or not met.
- feedback: encouraging and specific; acknowledge what the student got right before noting gaps; K-12 appropriate.
- misconception: if score is significantly low, name the underlying conceptual gap; set to null if the answer is mostly correct.

LANGUAGE RULE:
- Write the note, feedback, and misconception in the same language as the question.
- The question language is specified in the user message.`;
}

export function buildGradeUserMessage(question: Question, studentAnswer: string): string {
  const langLabel = LANG_LABELS[question.lang] ?? question.lang;
  const rubricLines = question.rubric
    .map((r) => `- [${r.id}] ${r.description} (weight: ${r.weight})`)
    .join("\n");

  return `Question Language: ${question.lang} (${langLabel})
Question: ${question.prompt}
Model Answer: ${question.modelAnswer}

Rubric Criteria:
${rubricLines}

Student's Answer:
${studentAnswer}

Evaluate each rubric criterion. All text in your response must be in ${langLabel}. Return ONLY the JSON object.`;
}
