import { Router } from "express";
import { GradeRequestSchema } from "../schemas/index.js";
import type { Store } from "../store/Store.js";
import type { GradingService } from "../services/GradingService.js";

export function makeGradeRouter(service: GradingService, store: Store): Router {
  const router = Router();

  router.post("/grade", async (req, res) => {
    const parsed = GradeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { questionId, studentAnswer } = parsed.data;
    const question = store.getQuestion(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    try {
      const result = await service.grade(question, studentAnswer);
      return res.status(200).json({ result });
    } catch (err) {
      console.error("Grading failed:", err);
      return res.status(500).json({ error: "Grading failed" });
    }
  });

  return router;
}
