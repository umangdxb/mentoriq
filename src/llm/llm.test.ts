import { describe, it, expect } from "vitest";
import { MockClient } from "./MockClient.js";
import { LLMResponseSchema } from "../schemas/index.js";

describe("MockClient", () => {
  it("returns a valid LLMResponse", async () => {
    const client = new MockClient();
    const result = await client.complete("Hello");
    expect(() => LLMResponseSchema.parse(result)).not.toThrow();
    expect(result.content).toBe("This is a mock LLM response.");
  });
});
