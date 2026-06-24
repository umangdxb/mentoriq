import { describe, it, expect } from "vitest";
import { QuestionGeneratorService } from "./QuestionGeneratorService.js";
import { QuestionSchema } from "../schemas/index.js";
import type { LLMClient, LLMCompleteOptions } from "../llm/LLMClient.js";
import type { LLMResponse, LearningContent, BloomLevel, Question } from "../schemas/index.js";

const CONTENT: LearningContent = {
  id: "test-content-id",
  text: "Plants use sunlight to make food through photosynthesis.",
  lang: "en",
};

function makeCannedQuestion(bloom: BloomLevel) {
  return {
    id: "llm-generated-id",
    contentId: "test-content-id",
    bloom,
    lang: "en",
    prompt: `Test question for ${bloom}`,
    rubric: [{ id: "r-1", description: "Mentions the key concept", weight: 1.0 }],
    modelAnswer: "Plants use sunlight to make food.",
  };
}

function makeLLMResponse(questions: unknown[]): LLMResponse {
  return { content: JSON.stringify(questions), model: "mock", usage: { input_tokens: 0, output_tokens: 0 } };
}

describe("QuestionGeneratorService", () => {
  it("returns well-formed Question[] validated by zod", async () => {
    const levels: BloomLevel[] = ["remember", "understand"];
    const client: LLMClient = {
      complete: async (_p: string, _o?: LLMCompleteOptions) =>
        makeLLMResponse(levels.map(makeCannedQuestion)),
    };
    const service = new QuestionGeneratorService(client);
    const result = await service.generate(CONTENT, levels, 1);

    expect(result).toHaveLength(2);
    result.forEach((q) => expect(() => QuestionSchema.parse(q)).not.toThrow());
    expect(result.map((q) => q.bloom)).toContain("remember");
    expect(result.map((q) => q.bloom)).toContain("understand");
  });

  it("handles markdown fences on first response", async () => {
    const raw = JSON.stringify([makeCannedQuestion("remember")]);
    const client: LLMClient = {
      complete: async (_p: string, _o?: LLMCompleteOptions) => ({
        content: "```json\n" + raw + "\n```",
        model: "mock",
        usage: { input_tokens: 0, output_tokens: 0 },
      }),
    };
    const service = new QuestionGeneratorService(client);
    const result = await service.generate(CONTENT, ["remember"], 1);

    expect(result).toHaveLength(1);
    expect(() => QuestionSchema.parse(result[0])).not.toThrow();
  });

  it("throws after two unparseable responses", async () => {
    const client: LLMClient = {
      complete: async (_p: string, _o?: LLMCompleteOptions) => ({
        content: "NOT JSON AT ALL",
        model: "mock",
        usage: { input_tokens: 0, output_tokens: 0 },
      }),
    };
    const service = new QuestionGeneratorService(client);
    await expect(service.generate(CONTENT, ["remember"], 1)).rejects.toThrow(
      "unparseable JSON after retry"
    );
  });

  it("preserves lang:ar through the pipeline", async () => {
    const arabicContent: LearningContent = {
      id: "ar-c-1",
      text: "البناء الضوئي هو العملية التي تستخدمها النباتات لتحويل الطاقة الضوئية إلى طاقة كيميائية.",
      lang: "ar",
    };
    const arabicQuestion: Omit<Question, "id" | "rubric"> & { id: string; rubric: Question["rubric"] } = {
      id: "q-ar-1",
      contentId: "ar-c-1",
      bloom: "remember",
      lang: "ar",
      prompt: "ما هو البناء الضوئي؟",
      rubric: [{ id: "r-1", description: "يذكر تحويل الطاقة الضوئية", weight: 1.0 }],
      modelAnswer: "البناء الضوئي هو تحويل الطاقة الضوئية إلى طاقة كيميائية في النباتات.",
    };
    const client: LLMClient = {
      complete: async (_p: string, _o?: LLMCompleteOptions) =>
        makeLLMResponse([arabicQuestion]),
    };
    const service = new QuestionGeneratorService(client);
    const result = await service.generate(arabicContent, ["remember"], 1);
    expect(result).toHaveLength(1);
    expect(result[0].lang).toBe("ar");
    expect(() => QuestionSchema.parse(result[0])).not.toThrow();
  });
});
