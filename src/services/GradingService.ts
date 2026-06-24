import type { LLMClient } from "../llm/LLMClient.js";
import { buildGradeSystemPrompt, buildGradeUserMessage } from "../llm/prompt.js";
import {
  GradeLLMResponseSchema,
  type GradeLLMResponse,
  type GradeResult,
  type Question,
} from "../schemas/index.js";

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseGradeResponse(raw: string): GradeLLMResponse | null {
  try {
    const parsed: unknown = JSON.parse(stripFences(raw));
    const result = GradeLLMResponseSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export class GradingService {
  constructor(private readonly llmClient: LLMClient) {}

  async grade(question: Question, studentAnswer: string): Promise<GradeResult> {
    const systemPrompt = buildGradeSystemPrompt();
    const userMessage = buildGradeUserMessage(question, studentAnswer);

    const raw1 = await this.llmClient.complete(userMessage, { systemPrompt, maxTokens: 2048 });
    let llmResult = parseGradeResponse(raw1.content);

    if (llmResult === null) {
      const raw2 = await this.llmClient.complete(
        userMessage + "\n\nIMPORTANT: Return ONLY valid JSON. No other text.",
        { systemPrompt, maxTokens: 2048 }
      );
      llmResult = parseGradeResponse(raw2.content);
    }

    if (llmResult === null) {
      throw new Error("LLM returned unparseable JSON after retry");
    }

    const score = llmResult.perCriterion.reduce((sum, c) => {
      const criterion = question.rubric.find((r) => r.id === c.id);
      return sum + (c.met && criterion ? criterion.weight : 0);
    }, 0);

    return {
      questionId: question.id,
      studentAnswer,
      score: Math.min(1, Math.max(0, score)),
      perCriterion: llmResult.perCriterion,
      feedback: llmResult.feedback,
      misconception: llmResult.misconception,
    };
  }
}
