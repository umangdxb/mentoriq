import type { Question } from "../schemas/index.js";

export interface Store {
  saveQuestion(q: Question): void;
  getQuestion(id: string): Question | undefined;
  listQuestions(): Question[];
}
