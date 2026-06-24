import { useState } from "react";
import type { Lang, Question, GradeResult } from "../api.ts";
import { gradeAnswer } from "../api.ts";

const BLOOM_COLORS: Record<string, string> = {
  remember: "bg-blue-100 text-blue-800",
  understand: "bg-green-100 text-green-800",
  apply: "bg-yellow-100 text-yellow-800",
  analyze: "bg-purple-100 text-purple-800",
};

interface Props {
  lang: Lang;
  question: Question | null;
  gradeResult: GradeResult | null;
  onGradeResult: (r: GradeResult) => void;
}

export default function GradePanel({ lang, question, gradeResult, onGradeResult }: Props) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = lang === "ar";

  const handleGrade = async () => {
    if (!question || !answer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await gradeAnswer({ questionId: question.id, studentAnswer: answer });
      onGradeResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setLoading(false);
    }
  };

  if (!question) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-center text-gray-400 text-sm min-h-[220px]">
        {isAr ? "اختر سؤالاً من القائمة للإجابة عليه" : "Select a question from the list to answer it"}
      </div>
    );
  }

  const scorePercent = gradeResult ? Math.round(gradeResult.score * 100) : null;
  const scoreBarColor = gradeResult
    ? gradeResult.score >= 0.7 ? "bg-green-500"
    : gradeResult.score >= 0.4 ? "bg-amber-400"
    : "bg-red-500"
    : "";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {isAr ? "الإجابة والتقييم" : "Answer & Grade"}
      </h2>

      {/* Question display */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-2 ${BLOOM_COLORS[question.bloom] ?? ""}`}>
          {question.bloom}
        </span>
        <p className="text-sm font-medium text-gray-800">{question.prompt}</p>
      </div>

      {/* Answer textarea */}
      <div>
        <label className="text-sm text-gray-500 block mb-1">
          {isAr ? "إجابتك" : "Your answer"}
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder={isAr ? "اكتب إجابتك هنا..." : "Write your answer here…"}
        />
      </div>

      <button
        onClick={handleGrade}
        disabled={loading || !answer.trim()}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
      >
        {loading
          ? (isAr ? "جارٍ التقييم…" : "Grading…")
          : (isAr ? "تقييم الإجابة" : "Grade My Answer")}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Grade results */}
      {gradeResult && (
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
          {/* Score bar */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-600 font-medium">{isAr ? "النتيجة" : "Score"}</span>
              <span className="font-bold text-gray-800">{scorePercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>

          {/* Per-criterion breakdown */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {isAr ? "تفاصيل التقييم" : "Criterion breakdown"}
            </p>
            <div className="flex flex-col gap-2">
              {gradeResult.perCriterion.map((c, i) => {
                const criterion = question.rubric.find((r) => r.id === c.id);
                return (
                  <div key={c.id} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${c.met ? "bg-green-500" : "bg-red-400"}`}>
                      {c.met ? "✓" : "✗"}
                    </span>
                    <div>
                      <p className="text-gray-700">{criterion?.description ?? `Criterion ${i + 1}`}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{c.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-blue-50 border-s-4 border-blue-400 rounded-e-lg p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
              {isAr ? "التغذية الراجعة" : "Feedback"}
            </p>
            <p className="text-sm text-blue-800">{gradeResult.feedback}</p>
          </div>

          {/* Misconception (conditional) */}
          {gradeResult.misconception && (
            <div className="bg-amber-50 border-s-4 border-amber-400 rounded-e-lg p-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                {isAr ? "الفهم الخاطئ المكتشف" : "Misconception detected"}
              </p>
              <p className="text-sm text-amber-800">{gradeResult.misconception}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
