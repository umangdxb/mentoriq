import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { OllamaClient } from "../llm/OllamaClient.js";
import { GradingService } from "../services/GradingService.js";
import { EvalHarness } from "./EvalHarness.js";
import { GoldenDatasetSchema } from "./types.js";
import type { EvalReport } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const GOLDEN_PATH = join(ROOT, "eval/golden.json");
const REPORT_PATH = join(ROOT, "eval-report.json");

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function printReport(report: EvalReport): void {
  const q = report.questionQuality;
  const g = report.gradingAgreement;
  const w = 56;
  const line = "═".repeat(w);
  const pad = (label: string, value: string) => {
    const gap = w - 4 - label.length - value.length;
    return `║  ${label}${" ".repeat(Math.max(1, gap))}${value}  ║`;
  };

  console.log(`\n╔${line}╗`);
  console.log(`║${"  EVAL REPORT — " + report.runAt}${" ".repeat(Math.max(0, w - 18 - report.runAt.length))}║`);
  console.log(`╠${line}╣`);
  console.log(`║  QUESTION QUALITY${" ".repeat(w - 18)}║`);
  console.log(pad("  Relevance", fmt(q.avgRelevance) + `  (${q.items.length} questions)`));
  console.log(pad("  Bloom-level match", fmt(q.avgBloomMatch)));
  console.log(pad("  Answerability", fmt(q.avgAnswerability)));
  console.log(pad("  Overall", fmt(q.overall)));
  console.log(`╠${line}╣`);
  console.log(`║  GRADING AGREEMENT${" ".repeat(w - 19)}║`);
  console.log(pad("  MAE", fmt(g.mae) + `  (${g.count} answers)`));
  const pct = (g.within02 * 100).toFixed(1);
  const hits = Math.round(g.within02 * g.count);
  console.log(pad("  Within ±0.20", `${pct}%  (${hits} / ${g.count})`));
  console.log(`╚${line}╝\n`);
}

async function main(): Promise<void> {
  console.log("Loading golden dataset...");
  const raw = readFileSync(GOLDEN_PATH, "utf-8");
  const parsed = GoldenDatasetSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error("golden.json failed validation:", parsed.error.flatten());
    process.exit(1);
  }

  const llmClient = new OllamaClient();
  const gradingService = new GradingService(llmClient);
  const harness = new EvalHarness(llmClient, gradingService);

  const report = await harness.run(parsed.data);

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Report written to eval-report.json`);

  printReport(report);
}

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exit(1);
});
