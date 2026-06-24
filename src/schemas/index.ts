import { z } from "zod";

export const LLMResponseSchema = z.object({
  content: z.string(),
  model: z.string().optional(),
  usage: z
    .object({
      input_tokens: z.number(),
      output_tokens: z.number(),
    })
    .optional(),
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  ts: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// --- Milestone 2: Question generation ---

export const BloomLevelSchema = z.enum(["remember", "understand", "apply", "analyze"]);
export const LangSchema = z.enum(["en", "ar"]);

export const LearningContentSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  lang: LangSchema,
  standardIds: z.array(z.string()).optional(),
});

export const RubricCriterionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().positive(),
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  contentId: z.string().min(1),
  bloom: BloomLevelSchema,
  lang: LangSchema,
  prompt: z.string().min(1),
  rubric: z.array(RubricCriterionSchema).min(1),
  modelAnswer: z.string().min(1),
});

export const QuestionArraySchema = z.array(QuestionSchema);

export const GenerateRequestSchema = z.object({
  text: z.string().min(10),
  lang: LangSchema,
  levels: z.array(BloomLevelSchema).min(1).max(4),
  count: z.number().int().min(1).max(5).default(1),
});

export type BloomLevel = z.infer<typeof BloomLevelSchema>;
export type Lang = z.infer<typeof LangSchema>;
export type LearningContent = z.infer<typeof LearningContentSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// --- Milestone 3: Rubric-based grading ---

export const PerCriterionResultSchema = z.object({
  id: z.string().min(1),
  met: z.boolean(),
  note: z.string().min(1),
});

export const GradeLLMResponseSchema = z.object({
  perCriterion: z.array(PerCriterionResultSchema).min(1),
  feedback: z.string().min(1),
  misconception: z.string().nullable(),
});

export const GradeResultSchema = z.object({
  questionId: z.string().min(1),
  studentAnswer: z.string().min(1),
  score: z.number().min(0).max(1),
  perCriterion: z.array(PerCriterionResultSchema).min(1),
  feedback: z.string().min(1),
  misconception: z.string().nullable(),
});

export const GradeRequestSchema = z.object({
  questionId: z.string().min(1),
  studentAnswer: z.string().min(1),
});

export type PerCriterionResult = z.infer<typeof PerCriterionResultSchema>;
export type GradeLLMResponse = z.infer<typeof GradeLLMResponseSchema>;
export type GradeResult = z.infer<typeof GradeResultSchema>;
export type GradeRequest = z.infer<typeof GradeRequestSchema>;
