import { useState, useEffect } from "react";
import type { Lang, Question, GradeResult, SeedContent } from "./api.ts";
import { fetchSeeds } from "./api.ts";
import GeneratePanel from "./components/GeneratePanel.tsx";
import GradePanel from "./components/GradePanel.tsx";

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [seeds, setSeeds] = useState<SeedContent[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);

  useEffect(() => {
    fetchSeeds().then(setSeeds).catch(console.error);
  }, []);

  const handleSelectQuestion = (q: Question) => {
    setSelected(q);
    setGradeResult(null);
    setLang(q.lang);
  };

  const handleQuestionsGenerated = (qs: Question[]) => {
    setQuestions(qs);
    setSelected(null);
    setGradeResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header — always LTR */}
      <header className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight">MentorIQ</h1>
          <p className="text-indigo-200 text-sm">Adaptive Question Generator + Auto-Grader</p>
        </div>
        <button
          onClick={() => setLang((l) => (l === "en" ? "ar" : "en"))}
          className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 rounded-lg px-4 py-1.5 text-sm font-medium transition"
        >
          {lang === "en" ? "العربية" : "English"}
        </button>
      </header>

      {/* Body — RTL when Arabic */}
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="max-w-7xl mx-auto px-4 py-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GeneratePanel
            lang={lang}
            seeds={seeds}
            onLangChange={setLang}
            onQuestionsGenerated={handleQuestionsGenerated}
            questions={questions}
            selectedId={selected?.id ?? null}
            onSelectQuestion={handleSelectQuestion}
          />
          <GradePanel
            lang={lang}
            question={selected}
            gradeResult={gradeResult}
            onGradeResult={setGradeResult}
          />
        </div>
      </main>
    </div>
  );
}
