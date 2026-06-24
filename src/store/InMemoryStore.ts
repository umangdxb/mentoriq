import type { Store } from "./Store.js";
import type { Question } from "../schemas/index.js";

export class InMemoryStore implements Store {
  private readonly questions = new Map<string, Question>();

  saveQuestion(q: Question): void {
    this.questions.set(q.id, q);
  }

  getQuestion(id: string): Question | undefined {
    return this.questions.get(id);
  }

  listQuestions(): Question[] {
    return Array.from(this.questions.values());
  }
}
