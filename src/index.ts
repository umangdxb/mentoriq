import "dotenv/config";
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { makeGenerateRouter } from "./routes/generate.js";
import { makeGradeRouter } from "./routes/grade.js";
import { seedsRouter } from "./routes/seeds.js";
import { evalRouter } from "./routes/eval.js";
import { OllamaClient } from "./llm/OllamaClient.js";
import { AnthropicClient } from "./llm/AnthropicClient.js";
import { InMemoryStore } from "./store/InMemoryStore.js";
import { QuestionGeneratorService } from "./services/QuestionGeneratorService.js";
import { GradingService } from "./services/GradingService.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

const store = new InMemoryStore();
const llmClient =
  process.env.LLM_PROVIDER === "anthropic" ? new AnthropicClient() : new OllamaClient();
const questionService = new QuestionGeneratorService(llmClient);
const gradingService = new GradingService(llmClient);

app.use("/", healthRouter);
app.use("/", makeGenerateRouter(questionService, store));
app.use("/", makeGradeRouter(gradingService, store));
app.use("/", seedsRouter);
app.use("/", evalRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
