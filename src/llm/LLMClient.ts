import type { LLMResponse } from "../schemas/index.js";

export interface LLMCompleteOptions {
  systemPrompt?: string;
  maxTokens?: number;
}

export interface LLMClient {
  complete(prompt: string, options?: LLMCompleteOptions): Promise<LLMResponse>;
}
