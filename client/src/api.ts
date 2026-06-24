export type Lang = "en" | "ar";
export type BloomLevel = "remember" | "understand" | "apply" | "analyze";

export interface SeedContent {
  title: string;
  text: string;
  lang: Lang;
}

export interface RubricCriterion {
  id: string;
  description: string;
  weight: number;
}

export interface Question {
  id: string;
  contentId: string;
  bloom: BloomLevel;
  lang: Lang;
  prompt: string;
  rubric: RubricCriterion[];
  modelAnswer: string;
}

export interface PerCriterionResult {
  id: string;
  met: boolean;
  note: string;
}

export interface GradeResult {
  questionId: string;
  studentAnswer: string;
  score: number;
  perCriterion: PerCriterionResult[];
  feedback: string;
  misconception: string | null;
}

export interface GenerateRequest {
  text: string;
  lang: Lang;
  levels: BloomLevel[];
  count: number;
}

export interface GradeRequest {
  questionId: string;
  studentAnswer: string;
}

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const fetchSeeds = () =>
  apiFetch<{ seeds: SeedContent[] }>("/seeds").then((r) => r.seeds);

export const generateQuestions = (body: GenerateRequest) =>
  apiFetch<{ questions: Question[] }>("/generate", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.questions);

export const gradeAnswer = (body: GradeRequest) =>
  apiFetch<{ result: GradeResult }>("/grade", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.result);
