import type { LLMClient, LLMCompleteOptions } from "./LLMClient.js";
import { LLMResponseSchema, type LLMResponse } from "../schemas/index.js";

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaClient implements LLMClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL ?? "phi4-mini";
  }

  async complete(prompt: string, options?: LLMCompleteOptions): Promise<LLMResponse> {
    const messages: { role: string; content: string }[] = [];

    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        ...(options?.maxTokens && { options: { num_predict: options.maxTokens } }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaChatResponse;

    return LLMResponseSchema.parse({
      content: data.message.content,
      model: data.model,
      usage: {
        input_tokens: data.prompt_eval_count ?? 0,
        output_tokens: data.eval_count ?? 0,
      },
    });
  }
}
