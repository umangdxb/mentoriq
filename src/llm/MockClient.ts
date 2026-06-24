import type { LLMClient, LLMCompleteOptions } from "./LLMClient.js";
import type { LLMResponse } from "../schemas/index.js";

export class MockClient implements LLMClient {
  async complete(_prompt: string, _options?: LLMCompleteOptions): Promise<LLMResponse> {
    return {
      content: "This is a mock LLM response.",
      model: "mock",
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  }
}
