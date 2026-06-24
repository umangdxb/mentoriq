import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const REPORT_PATH = join(dirname(fileURLToPath(import.meta.url)), "../../eval-report.json");

export const evalRouter = Router();

evalRouter.get("/eval/report", (_req, res) => {
  try {
    const report = JSON.parse(readFileSync(REPORT_PATH, "utf-8")) as unknown;
    return res.json(report);
  } catch {
    return res.status(404).json({ error: "No eval report found. Run 'npm run eval' first." });
  }
});
