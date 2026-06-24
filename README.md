# MentorIQ — Adaptive Question Generator + Auto-Grader

> A deployable demo for the AI Lead Engineer role at Alef Education.

A service that turns any learning content into standards-aligned questions and grades free-text student answers — with bilingual English / Arabic support baked in from day one.

---

## The problem it solves

Alef's platform needs to generate personalized, curriculum-aligned assessments at a scale that human authors cannot sustain. A teacher can write three good questions for a paragraph in ten minutes; a school district needs thousands, in two languages, calibrated across Bloom's taxonomy, each with a rubric that makes grading explainable to parents. This system automates that pipeline while keeping a human-auditable eval loop so you always know whether the AI is actually performing.

---

## Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │                Frontend (React)             │
                 │   Generate panel    │    Grade panel        │
                 └───────────┬─────────────────────┬───────────┘
                             │ REST                 │ REST
                 ┌───────────▼─────────────────────▼───────────┐
                 │                  API (Express/TS)            │
                 │  /generate   /grade   /seeds   /health       │
                 └───┬───────────────┬──────────────────────────┘
                     │               │
            ┌────────▼──────┐ ┌──────▼───────┐ ┌──────────────┐
            │ QuestionGen   │ │ GradingChain │ │ EvalHarness  │
            │  service      │ │  service     │ │  (CLI)       │
            └───────┬───────┘ └──────┬───────┘ └──────────────┘
                    │                │
            ┌───────▼────────────────▼───────┐
            │         LLMClient (interface)   │  ← swap Anthropic ↔ Ollama
            └─────────────────────────────────┘
            ┌─────────────────────────────────┐
            │  Store (in-memory | pluggable)   │
            └─────────────────────────────────┘
```

Every external dependency has a no-config fallback: the `LLMClient` interface lets you swap providers without touching service code; the `Store` interface ships with an in-memory implementation so the demo runs with zero external infrastructure.

---

## Features

| Feature | Status |
|---|---|
| Bloom's taxonomy question generation (remember → analyze) | ✅ |
| Per-criterion rubric grading with weighted score | ✅ |
| Bilingual EN / AR with RTL frontend layout | ✅ |
| Eval harness: LLM-as-judge + grading agreement vs. human labels | ✅ |
| Provider-swappable LLM layer (Anthropic / Ollama) | ✅ |
| Defensive JSON parsing with retry-once on parse failure | ✅ |
| 9 pre-loaded seed topics across mathematics and science (EN + AR) | ✅ |

---

## Live demo

| Service | URL |
|---|---|
| Frontend (Vercel) | https://mentoriq-ai.vercel.app |
| Backend API (Railway) | https://celebrated-spontaneity-production-8e8a.up.railway.app |
| Source code (GitHub) | https://github.com/umangdxb/mentoriq |

---

## Quick start

```bash
git clone https://github.com/umangdxb/mentoriq.git
cd mentoriq

# Backend
cp .env.example .env          # fill in OLLAMA_BASE_URL or set LLM_PROVIDER=anthropic
npm install
npm run dev                   # API on :3000

# Frontend (separate terminal)
cd client
npm install
npm run dev                   # UI on :5173 (proxies /generate, /grade, /seeds → :3000)
```

Open [http://localhost:5173](http://localhost:5173).

---

## API reference

### `POST /generate`

```json
{ "text": "...", "lang": "en", "levels": ["remember", "analyze"], "count": 1 }
```

Returns an array of `Question` objects, each with a prompt, rubric criteria (weights summing to 1.0), and a model answer.

### `POST /grade`

```json
{ "questionId": "...", "studentAnswer": "..." }
```

Returns per-criterion met/not-met notes, a weighted score (0–1), student-facing feedback, and the inferred misconception when the answer is wrong.

### `GET /seeds`

Returns 9 pre-loaded sample topics for live demos with no copy-paste required:

| Topic | Language |
|---|---|
| Photosynthesis | English |
| Fractions | English |
| Algebra — Linear Equations | English |
| Geometry — Triangles | English |
| Statistics — Mean, Median and Mode | English |
| The Water Cycle | English |
| البناء الضوئي (Photosynthesis) | Arabic |
| دورة الماء (Water Cycle) | Arabic |
| الكسور (Fractions) | Arabic |

### `GET /health`

`{ "status": "ok", "ts": "<iso>" }`

---

## Evaluation results

Run `npm run eval` to reproduce. The harness grades 6 golden questions across 18 student answers (human-labelled at 1.0 / ~0.5 / 0.0) and judges question quality via LLM-as-judge on three axes.

```
╔════════════════════════════════════════════════════════╗
║  EVAL REPORT — 2026-06-24                            ║
╠════════════════════════════════════════════════════════╣
║  QUESTION QUALITY                                      ║
║    Relevance                      1.00  (6 questions)  ║
║    Bloom-level match                             0.46  ║
║    Answerability                                 1.00  ║
║    Overall                                       0.82  ║
╠════════════════════════════════════════════════════════╣
║  GRADING AGREEMENT                                     ║
║    MAE                             0.48  (18 answers)  ║
║    Within ±0.20                       33.3%  (6 / 18)  ║
╚════════════════════════════════════════════════════════╝
```

**What the numbers mean:**

- **Relevance 1.00, Answerability 1.00** — every generated question was judged fully grounded in the source content and answerable without outside knowledge. This is the hallucination-control signal: the prompt instructs the model to discard any question requiring outside knowledge.
- **Bloom match 0.46** — phi4-mini (3.8B parameters, running locally) struggles to reliably hit the requested cognitive level. With Claude 3.5 Sonnet the same prompt template produces scores ≥ 0.80 in manual spot-checks. The fix is a larger model or a post-generation Bloom classifier step — both are cheap given the interface is already swappable.
- **Grading MAE 0.48 / Within ±0.20 at 33%** — phi4-mini tends toward mid-range scores even when the correct answer is clearly 1.0 or 0.0. Again, model-size is the dominant driver. The per-criterion architecture means the score formula is deterministic (computed in code, not by the LLM), so agreement improves automatically as the LLM's criterion judgements improve — no prompt surgery needed.

The eval harness is the mechanism that makes model upgrades safe: swap the provider, re-run `npm run eval`, compare reports.

---

## Design tradeoffs

### API model vs. on-prem / self-hosted

For a K-12 deployment in the UAE or KSA, student data residency requirements (PDPL, UAE PIPA) make sending raw lesson content to a US-based cloud API a compliance concern. The `LLMClient` interface was built for exactly this: switch `LLM_PROVIDER=anthropic` to use Claude via API, or leave it unset to run Ollama locally. The tradeoff is quality vs. compliance; the architecture keeps both options open without a rewrite.

### Latency vs. cost

Streaming is not implemented yet. A generate call on phi4-mini (local) takes 8–15 s; on Claude Haiku via API it would be < 3 s at a fraction of the cost of Sonnet. For a real product the right shape is: use a fast small model for first-pass generation, re-rank/validate with a larger model only when quality thresholds aren't met — a two-stage approach that keeps P50 latency low.

### Per-criterion grading vs. holistic scoring

Holistic grading (one score, one sentence of feedback) is fast to prompt but opaque. K-12 stakeholders — teachers, parents — need to understand *why* a student scored 0.6, not just that they did. The per-criterion rubric makes the score fully explainable: each criterion maps to a specific learning objective, and the feedback cites exactly which criteria were missed. The weighted sum is computed in code, not by the LLM, so the final score is deterministic and auditable even if the criterion judgements vary.

### Hallucination control

Two mitigations are in place:
1. The system prompt explicitly instructs the model to only generate questions answerable from the provided content (borne out by the Relevance and Answerability scores both hitting 1.00).
2. All LLM outputs are Zod-validated before use; malformed responses trigger a single retry with a stricter prompt, then hard-fail — the service never silently accepts a bad output.

A third mitigation worth adding in production is a semantic-similarity check: embed the question, embed the source content, verify cosine similarity exceeds a threshold before accepting the question.

---

## What I'd build next

1. **Vector retrieval over a content library.** Right now content is pasted in-request. In production, lessons live in a database; the service should retrieve relevant paragraphs given a curriculum standard ID using cosine similarity over embeddings. The `Store` interface has a slot for this.

2. **Real curriculum-standard alignment.** Tag each generated question to a UAE MoE or IB standard via semantic similarity to a standards embedding bank. This closes the loop from "question" to "which competency is being assessed," which is what adaptive-sequencing engines need.

3. **Mastery model + adaptive sequencing.** Once you have per-student grade histories attached to standards, you can model P(mastery | evidence) with a simple Bayesian update (or a small LSTM) and route each student to the next question that maximises expected learning gain. This is the core of what Alef's platform is trying to do.

4. **Misconception clustering.** Embed wrong student answers, cluster them, and surface the top-N misconceptions per question to the teacher dashboard. This turns individual grading into aggregate insight — a teacher can see "40% of this class have the same photosynthesis misconception" and intervene at class level.

5. **Streaming generation.** Replace the current fire-and-wait pattern with SSE streaming so the UI can render questions as tokens arrive. Cuts perceived latency by ~70% on longer content.

6. **Two-stage Bloom calibration.** Generate N candidates at the target level, run a lightweight Bloom classifier on each, keep the best match. Fixes the 0.46 Bloom match score without requiring a larger base model.

---

## Project structure

```
src/
  llm/
    LLMClient.ts          ← interface (swap providers here)
    OllamaClient.ts       ← default (local, no API key needed)
    AnthropicClient.ts    ← production (set LLM_PROVIDER=anthropic)
    prompt.ts             ← all prompt engineering in one file
  services/
    QuestionGeneratorService.ts
    GradingService.ts
  routes/
    generate.ts  grade.ts  seeds.ts  health.ts  eval.ts
  store/
    Store.ts              ← interface
    InMemoryStore.ts      ← zero-infra implementation
  eval/
    EvalHarness.ts
    run.ts                ← npm run eval
  schemas/index.ts        ← all Zod schemas + inferred TS types
client/
  src/
    api.ts                ← typed fetch wrappers
    App.tsx               ← root state + RTL switching
    components/
      GeneratePanel.tsx
      GradePanel.tsx
eval/
  golden.json             ← 6 content+question+answer triples, human-scored
```

---

## Environment variables

### Backend (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `phi4-mini` | Model name |
| `LLM_PROVIDER` | _(unset = Ollama)_ | Set to `anthropic` to use Claude API |
| `ANTHROPIC_API_KEY` | — | Required when `LLM_PROVIDER=anthropic` |
| `CORS_ORIGIN` | `*` | Restrict to your Vercel frontend URL in production |
| `PORT` | `3000` | API port |

### Frontend (`client/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | _(empty = Vite proxy)_ | Set to the deployed API URL in production |

---

## Deploy

### Backend → Railway

1. Connect the repo; set build command `npm run build`, start command `npm start`.
2. Set `CORS_ORIGIN` to your Vercel frontend URL.
3. **LLM options (pick one):**
   - **Ollama via Cloudflare tunnel** (zero API cost): run Ollama locally, expose it with `cloudflared tunnel`, set `OLLAMA_BASE_URL=<tunnel-url>` and `OLLAMA_MODEL=phi4-mini`.
   - **Anthropic API**: set `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

### Frontend → Vercel

1. Set root directory to `client/`, build command `npm run build`, output `dist/`.
2. Set `VITE_API_BASE_URL` to the Railway service URL.
3. `client/vercel.json` handles the SPA rewrite.

---

## Running tests

```bash
npm test          # 9 unit tests (mock LLM client — no API key needed)
npm run eval      # full eval harness (requires Ollama or ANTHROPIC_API_KEY)
```
