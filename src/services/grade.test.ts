import { describe, it, expect } from "vitest";
import { GradingService } from "./GradingService.js";
import type { LLMClient, LLMCompleteOptions } from "../llm/LLMClient.js";
import type { LLMResponse, Question } from "../schemas/index.js";

const QUESTION: Question = {
  id: "q-1",
  contentId: "c-1",
  bloom: "remember",
  lang: "en",
  prompt: "What is photosynthesis?",
  rubric: [
    { id: "r-1", description: "Mentions sunlight as the energy source", weight: 0.6 },
    { id: "r-2", description: "Mentions glucose as the product", weight: 0.4 },
  ],
  modelAnswer: "Photosynthesis uses sunlight to produce glucose.",
};

function makeLLMResponse(body: object): LLMResponse {
  return { content: JSON.stringify(body), model: "mock", usage: { input_tokens: 0, output_tokens: 0 } };
}

function makeClient(body: object): LLMClient {
  return {
    complete: async (_p: string, _o?: LLMCompleteOptions) => makeLLMResponse(body),
  };
}

describe("GradingService", () => {
  it("correct answer scores 1.0 with no misconception", async () => {
    const client = makeClient({
      perCriterion: [
        { id: "r-1", met: true, note: "Correctly mentions sunlight." },
        { id: "r-2", met: true, note: "Correctly mentions glucose." },
      ],
      feedback: "Excellent work! You captured both key ideas.",
      misconception: null,
    });
    const result = await new GradingService(client).grade(QUESTION, "Plants use sunlight to make glucose.");
    expect(result.score).toBeCloseTo(1.0);
    expect(result.misconception).toBeNull();
    expect(result.perCriterion).toHaveLength(2);
  });

  it("partial answer scores 0.6 (only first criterion met)", async () => {
    const client = makeClient({
      perCriterion: [
        { id: "r-1", met: true, note: "Mentions sunlight." },
        { id: "r-2", met: false, note: "Does not mention glucose." },
      ],
      feedback: "Good start! You mentioned sunlight — now include what the plant produces.",
      misconception: null,
    });
    const result = await new GradingService(client).grade(QUESTION, "Plants use sunlight for energy.");
    expect(result.score).toBeCloseTo(0.6);
    expect(result.misconception).toBeNull();
  });

  it("works with Arabic question and returns Arabic feedback", async () => {
    const arabicQuestion: Question = {
      ...QUESTION,
      lang: "ar",
      prompt: "ما هو البناء الضوئي؟",
      rubric: [
        { id: "r-1", description: "يذكر ضوء الشمس مصدرًا للطاقة", weight: 0.6 },
        { id: "r-2", description: "يذكر الجلوكوز كناتج", weight: 0.4 },
      ],
      modelAnswer: "البناء الضوئي يستخدم ضوء الشمس لإنتاج الجلوكوز.",
    };
    const client = makeClient({
      perCriterion: [
        { id: "r-1", met: true, note: "ذكر ضوء الشمس بشكل صحيح." },
        { id: "r-2", met: true, note: "ذكر الجلوكوز بشكل صحيح." },
      ],
      feedback: "أحسنت! لقد أجبت على السؤال بشكل صحيح وكامل.",
      misconception: null,
    });
    const result = await new GradingService(client).grade(
      arabicQuestion,
      "النباتات تستخدم ضوء الشمس لصنع الجلوكوز."
    );
    expect(result.score).toBeCloseTo(1.0);
    expect(result.misconception).toBeNull();
    expect(result.feedback).toBeTruthy();
  });

  it("wrong answer scores 0 and returns a misconception", async () => {
    const client = makeClient({
      perCriterion: [
        { id: "r-1", met: false, note: "Does not mention sunlight." },
        { id: "r-2", met: false, note: "Does not mention glucose." },
      ],
      feedback: "Keep trying! Photosynthesis is how plants make their own food using light energy.",
      misconception: "Confuses nutrient uptake from soil with photosynthesis",
    });
    const result = await new GradingService(client).grade(QUESTION, "Plants eat soil to get energy.");
    expect(result.score).toBeCloseTo(0);
    expect(result.misconception).toBe("Confuses nutrient uptake from soil with photosynthesis");
  });
});
