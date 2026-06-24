import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient, LLMCompleteOptions } from "./LLMClient.js";
import { LLMResponseSchema, type LLMResponse } from "../schemas/index.js";

export class AnthropicClient implements LLMClient {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  async complete(prompt: string, options?: LLMCompleteOptions): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: options?.maxTokens ?? 4096,
      system: options?.systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock?.type === "text" ? textBlock.text : "";

    return LLMResponseSchema.parse({
      content,
      model: response.model,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  }
}
