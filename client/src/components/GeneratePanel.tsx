import { useState } from "react";
import type { Lang, Question, BloomLevel, SeedContent } from "../api.ts";
import { generateQuestions } from "../api.ts";

const BLOOM_LEVELS: BloomLevel[] = ["remember", "understand", "apply", "analyze"];

const BLOOM_COLORS: Record<BloomLevel, string> = {
  remember: "bg-blue-100 text-blue-800",
  understand: "bg-green-100 text-green-800",
  apply: "bg-yellow-100 text-yellow-800",
  analyze: "bg-purple-100 text-purple-800",
};

interface Props {
  lang: Lang;
  seeds: SeedContent[];
  onLangChange: (l: Lang) => void;
  onQuestionsGenerated: (q: Question[]) => void;
  questions: Question[];
  selectedId: string | null;
  onSelectQuestion: (q: Question) => void;
}

export default function GeneratePanel({
  lang, seeds, onLangChange, onQuestionsGenerated, questions, selectedId, onSelectQuestion,
}: Props) {
  const [text, setText] = useState("");
  const [levels, setLevels] = useState<BloomLevel[]>(["remember", "understand"]);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = lang === "ar";

  const toggleLevel = (l: BloomLevel) =>
    setLevels((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);

  const handleSeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seed = seeds.find((s) => s.title === e.target.value);
    if (seed) {
      setText(seed.text);
      onLangChange(seed.lang);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim() || levels.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const qs = await generateQuestions({ text, lang, levels, count });
      onQuestionsGenerated(qs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {isAr ? "توليد الأسئلة" : "Generate Questions"}
      </h2>

      {/* Seed picker */}
      {seeds.length > 0 && (
        <div>
          <label className="text-sm text-gray-500 block mb-1">
            {isAr ? "محتوى نموذجي" : "Load sample content"}
          </label>
          <select
            onChange={handleSeedChange}
            defaultValue=""
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">{isAr ? "— اختر مثالاً —" : "— choose a sample —"}</option>
            {seeds.map((s) => (
              <option key={s.title} value={s.title}>{s.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Content textarea */}
      <div>
        <label className="text-sm text-gray-500 block mb-1">
          {isAr ? "المحتوى التعليمي" : "Learning content"}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder={isAr ? "الصق المحتوى التعليمي هنا..." : "Paste learning content here…"}
        />
      </div>

      {/* Bloom level toggles */}
      <div>
        <label className="text-sm text-gray-500 block mb-2">
          {isAr ? "مستويات بلوم" : "Bloom levels"}
        </label>
        <div className="flex flex-wrap gap-2">
          {BLOOM_LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => toggleLevel(l)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                levels.includes(l)
                  ? BLOOM_COLORS[l] + " border-transparent"
                  : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Count + Generate button */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500 whitespace-nowrap">
          {isAr ? "عدد لكل مستوى:" : "Per level:"}
        </label>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading || !text.trim() || levels.length === 0}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          {loading
            ? (isAr ? "جارٍ التوليد…" : "Generating…")
            : (isAr ? "توليد الأسئلة" : "Generate Questions")}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Questions list */}
      {questions.length > 0 && (
        <div className="flex flex-col gap-2 mt-1 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {isAr
              ? `${questions.length} سؤال — اختر سؤالاً للإجابة عليه`
              : `${questions.length} question(s) — click one to answer`}
          </p>
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q)}
              className={`text-start w-full rounded-lg border p-3 transition ${
                selectedId === q.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
              }`}
            >
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1.5 ${BLOOM_COLORS[q.bloom]}`}>
                {q.bloom}
              </span>
              <p className="text-sm text-gray-800">{q.prompt}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
