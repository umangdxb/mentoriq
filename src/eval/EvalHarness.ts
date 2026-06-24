import type { LLMClient } from "../llm/LLMClient.js";
import type { GradingService } from "../services/GradingService.js";
import { QuestionJudgeSchema } from "./types.js";
import type {
  GoldenDataset,
  GoldenItem,
  GradingAgreementResult,
  EvalReport,
  QuestionQualityScore,
} from "./types.js";

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

const JUDGE_SYSTEM_PROMPT = `You are an expert K-12 educational assessment reviewer.

OUTPUT RULES (non-negotiable):
- Respond with ONLY a raw JSON object. No prose. No markdown. No code fences.
- The object must be exactly: { "relevance": <0-1>, "bloomMatch": <0-1>, "answerability": <0-1> }

SCORING CRITERIA:
- relevance (0-1): Is every part of the question directly answerable from the provided content, without requiring outside knowledge? 1 = fully grounded, 0 = requires knowledge not in the content.
- bloomMatch (0-1): Does the question accurately target the specified Bloom's taxonomy level using appropriate cognitive verbs and complexity? 1 = precise match, 0 = clearly wrong level.
- answerability (0-1): Can a typical K-12 student answer this question in 1-3 sentences without ambiguity? 1 = clearly answerable, 0 = too vague, trick question, or requires expert knowledge.

Use decimal precision (e.g. 0.75, 0.9). Do not round to only 0 or 1.`;

function buildJudgeUserMessage(item: GoldenItem): string {
  return `Content:
${item.content.text}

Question: ${item.question.prompt}
Bloom Level: ${item.question.bloom}
Model Answer: ${item.question.modelAnswer}

Score this question on relevance, bloomMatch, and answerability. Return ONLY the JSON object.`;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export class EvalHarness {
  constructor(
    private readonly llmClient: LLMClient,
    private readonly gradingService: GradingService
  ) {}

  async judgeQuestionQuality(item: GoldenItem): Promise<QuestionQualityScore> {
    const userMessage = buildJudgeUserMessage(item);
    const fallback: QuestionQualityScore = {
      questionId: item.question.id,
      bloom: item.question.bloom,
      relevance: 0,
      bloomMatch: 0,
      answerability: 0,
      mean: 0,
    };

    const tryParse = (raw: string) => {
      try {
        const result = QuestionJudgeSchema.safeParse(JSON.parse(stripFences(raw)));
        return result.success ? result.data : null;
      } catch {
        return null;
      }
    };

    try {
      const raw1 = await this.llmClient.complete(userMessage, {
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        maxTokens: 256,
      });
      let scores = tryParse(raw1.content);

      if (!scores) {
        const raw2 = await this.llmClient.complete(
          userMessage + "\n\nIMPORTANT: Return ONLY valid JSON. No other text.",
          { systemPrompt: JUDGE_SYSTEM_PROMPT, maxTokens: 256 }
        );
        scores = tryParse(raw2.content);
      }

      if (!scores) {
        console.warn(`[EvalHarness] Judge parse failed for question ${item.question.id}, using 0s`);
        return fallback;
      }

      const mean = avg([scores.relevance, scores.bloomMatch, scores.answerability]);
      return { questionId: item.question.id, bloom: item.question.bloom, ...scores, mean };
    } catch (err) {
      console.warn(`[EvalHarness] Judge call failed for ${item.question.id}:`, err);
      return fallback;
    }
  }

  async runGradingAgreement(items: GoldenItem[]): Promise<GradingAgreementResult[]> {
    const results: GradingAgreementResult[] = [];
    for (const item of items) {
      for (const sa of item.studentAnswers) {
        try {
          const gradeResult = await this.gradingService.grade(item.question, sa.text);
          results.push({
            questionId: item.question.id,
            studentAnswer: sa.text,
            humanScore: sa.humanScore,
            modelScore: gradeResult.score,
            error: Math.abs(sa.humanScore - gradeResult.score),
          });
        } catch (err) {
          console.warn(`[EvalHarness] Grade failed for ${item.question.id}:`, err);
        }
      }
    }
    return results;
  }

  async run(dataset: GoldenDataset): Promise<EvalReport> {
    console.log(`Running question quality eval on ${dataset.items.length} questions...`);
    const qualityItems: QuestionQualityScore[] = [];
    for (const item of dataset.items) {
      const score = await this.judgeQuestionQuality(item);
      qualityItems.push(score);
      process.stdout.write(".");
    }
    console.log();

    console.log(`Running grading agreement eval on ${dataset.items.length} questions...`);
    const agreementItems = await this.runGradingAgreement(dataset.items);
    console.log();

    const mae = avg(agreementItems.map((r) => r.error));
    const within02Count = agreementItems.filter((r) => r.error <= 0.2).length;

    return {
      runAt: new Date().toISOString(),
      questionQuality: {
        items: qualityItems,
        avgRelevance: avg(qualityItems.map((q) => q.relevance)),
        avgBloomMatch: avg(qualityItems.map((q) => q.bloomMatch)),
        avgAnswerability: avg(qualityItems.map((q) => q.answerability)),
        overall: avg(qualityItems.map((q) => q.mean)),
      },
      gradingAgreement: {
        items: agreementItems,
        mae,
        within02: agreementItems.length > 0 ? within02Count / agreementItems.length : 0,
        count: agreementItems.length,
      },
    };
  }
}
