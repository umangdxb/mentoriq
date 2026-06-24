import { Router } from "express";
import { randomUUID } from "crypto";
import { GenerateRequestSchema } from "../schemas/index.js";
import type { Store } from "../store/Store.js";
import type { QuestionGeneratorService } from "../services/QuestionGeneratorService.js";

export function makeGenerateRouter(service: QuestionGeneratorService, store: Store): Router {
  const router = Router();

  router.post("/generate", async (req, res) => {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { text, lang, levels, count } = parsed.data;
    const content = { id: randomUUID(), text, lang };

    try {
      const questions = await service.generate(content, levels, count);
      questions.forEach((q) => store.saveQuestion(q));
      return res.status(200).json({ questions });
    } catch (err) {
      console.error("Question generation failed:", err);
      return res.status(500).json({ error: "Question generation failed" });
    }
  });

  return router;
}
