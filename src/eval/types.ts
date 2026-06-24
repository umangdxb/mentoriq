import { z } from "zod";
import { LearningContentSchema, QuestionSchema, BloomLevelSchema } from "../schemas/index.js";

export const GoldenStudentAnswerSchema = z.object({
  text: z.string().min(1),
  humanScore: z.number().min(0).max(1),
});

export const GoldenItemSchema = z.object({
  content: LearningContentSchema,
  question: QuestionSchema,
  studentAnswers: z.array(GoldenStudentAnswerSchema).min(1),
});

export const GoldenDatasetSchema = z.object({
  items: z.array(GoldenItemSchema).min(1),
});

export const QuestionJudgeSchema = z.object({
  relevance: z.number().min(0).max(1),
  bloomMatch: z.number().min(0).max(1),
  answerability: z.number().min(0).max(1),
});

export const QuestionQualityScoreSchema = QuestionJudgeSchema.extend({
  questionId: z.string(),
  bloom: BloomLevelSchema,
  mean: z.number(),
});

export const GradingAgreementResultSchema = z.object({
  questionId: z.string(),
  studentAnswer: z.string(),
  humanScore: z.number(),
  modelScore: z.number(),
  error: z.number(),
});

export const EvalReportSchema = z.object({
  runAt: z.string(),
  questionQuality: z.object({
    items: z.array(QuestionQualityScoreSchema),
    avgRelevance: z.number(),
    avgBloomMatch: z.number(),
    avgAnswerability: z.number(),
    overall: z.number(),
  }),
  gradingAgreement: z.object({
    items: z.array(GradingAgreementResultSchema),
    mae: z.number(),
    within02: z.number(),
    count: z.number(),
  }),
});

export type GoldenStudentAnswer = z.infer<typeof GoldenStudentAnswerSchema>;
export type GoldenItem = z.infer<typeof GoldenItemSchema>;
export type GoldenDataset = z.infer<typeof GoldenDatasetSchema>;
export type QuestionQualityScore = z.infer<typeof QuestionQualityScoreSchema>;
export type GradingAgreementResult = z.infer<typeof GradingAgreementResultSchema>;
export type EvalReport = z.infer<typeof EvalReportSchema>;
