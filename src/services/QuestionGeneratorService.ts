import { randomUUID } from "crypto";
import type { LLMClient } from "../llm/LLMClient.js";
import { buildSystemPrompt, buildUserMessage } from "../llm/prompt.js";
import { QuestionArraySchema, type BloomLevel, type LearningContent, type Question } from "../schemas/index.js";

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseAndValidate(raw: string): Question[] | null {
  try {
    const parsed: unknown = JSON.parse(stripFences(raw));
    const result = QuestionArraySchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data.map((q) => ({
      ...q,
      id: randomUUID(),
      rubric: q.rubric.map((r) => ({ ...r, id: randomUUID() })),
    }));
  } catch {
    return null;
  }
}

export class QuestionGeneratorService {
  constructor(private readonly llmClient: LLMClient) {}

  async generate(
    content: LearningContent,
    levels: BloomLevel[],
    count: number
  ): Promise<Question[]> {
    const systemPrompt = buildSystemPrompt(levels);
    const userMessage = buildUserMessage(content, levels, count);

    const raw1 = await this.llmClient.complete(userMessage, { systemPrompt, maxTokens: 4096 });
    let questions = parseAndValidate(raw1.content);

    if (questions === null) {
      const raw2 = await this.llmClient.complete(
        userMessage + "\n\nIMPORTANT: Return ONLY valid JSON. No other text.",
        { systemPrompt, maxTokens: 4096 }
      );
      questions = parseAndValidate(raw2.content);
    }

    if (questions === null) {
      throw new Error("LLM returned unparseable JSON after retry");
    }

    return questions;
  }
}
