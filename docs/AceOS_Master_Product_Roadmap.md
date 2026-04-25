# AceOS™ — Master Product Roadmap
### *"Study Smarter, Not Harder"*
**Version 4.0 | Full Refinement — Subject-Aware · Pluggable Architecture · i18n Ready | April 2026**

---

## 📌 North Star & Strategic Foundation

**North Star Metric:** Number of students who improve their GPA by ≥0.3 points OR score a 4/5 on an AP exam after 90 days of active use.

**Mission:** Build the operating system for every high school student's academic life — unifying daily grade performance, AP exam mastery, AI tutoring, and social accountability into one intelligent, adaptive platform.

**The Core Belief:** Students don't fail because they're lazy. They fail because they don't have a *system*. AceOS is the system.

### 🧭 Four Founding Engineering Principles

These principles must be present in every sprint planning session, story grooming, and architecture decision from Day 1:

| Principle | What It Means in Practice |
|---|---|
| **1. Subject-Type Awareness** | Every feature must declare which subject rendering mode(s) it supports: `TEXT`, `VISUAL/STEM`, `LANGUAGE`. A question in AP Calc is not the same as AP Spanish — the content model, input method, and AI grading logic differ fundamentally. |
| **2. Pluggable-First Architecture** | Every integration point (LLM provider, payment processor, auth, email, storage, FSRS engine, analytics) is abstracted behind a provider interface. Swapping any vendor = config change, not a code rewrite. |
| **3. i18n & Localization Ready** | All UI strings, content schemas, and AI prompts must be structured to support multiple languages from Sprint 1. Even if we only ship English at launch, the pipes must be in place. |
| **4. Config-Driven Feature Flags** | Every feature, subject module, provider, and content type is toggleable via a central config/feature-flag system. This enables per-subject rollouts, A/B testing, and safe incremental launches. |

> **Sprint Planning Reminder:** At the start of every sprint and story grooming session, ask: *"Does this story respect all 4 founding principles? Is the subject type declared? Is the integration point abstracted? Is the string localizable? Is this feature-flagged?"* If not — the story is not ready.

---

## 🌍 Market Reality Check

| Signal | Data Point |
|---|---|
| Smart Learning Market (2025) | $80.69B → $178.62B by 2030 at 17.2% CAGR |
| California K-12 Enrollment (2025–26) | ~9.9 million students |
| California HS Students (Gr. 9–12 est.) | ~1.85 million |
| AP Exams 2026 Window | May 4–15 with late window May 18–22 |
| AP Exams Going Fully Digital | Bluebook™ hybrid format live now |
| #1 Study Technique (evidence-based) | Spaced Repetition using FSRS algorithm — 20–30% fewer reviews than older SM-2 for same retention |
| Personalized Learning Gap | 78% of edtech publishers struggle to scale AI personalization |
| California HS Enrollment Trend | Declining 1.3%/year — focus on quality of engagement over raw volume |
| Foreign Language AP Enrollment | AP Spanish Language #2 most-taken AP exam nationally (~400K students/yr); AP French, AP Chinese, AP Japanese also significant |
| STEM Visual Learning Gap | AP Calc, AP Bio, AP Chem, AP Physics all require diagram annotation, graph interpretation, and formula rendering — zero existing AP prep tools handle this natively in a digital exam format |

**The Opportunity Gap:** No single product today unifies daily GPA maintenance + AP exam mastery + AI Socratic tutoring + social accountability under one adaptive student intelligence profile — *and* handles the full spectrum from essay-based humanities to visual STEM to spoken foreign language. That gap is the entire AceOS thesis.

---

## 🏗️ Suite Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AceIt Dashboard                   │  ← The Front Door
├──────────────┬──────────────┬──────────┬────────────┤
│  GradeGuard  │ ScoreBoost AP│StudySensei│ SmartPack  │  ← 4 Core Modules
├──────────────┴──────────────┴──────────┴────────────┤
│   Subject-Type Rendering Layer (TEXT | VISUAL | LANGUAGE)   │  ← NEW
├─────────────────────────────────────────────────────┤
│          Student Intelligence Profile (SIP)          │  ← Shared AI Brain
│  (Learning style · Subject type prefs · Weak concepts  │
│   GPA arc · AP score projection · Burnout risk index)  │
├─────────────────────────────────────────────────────┤
│         Pluggable Provider Abstraction Layer          │  ← NEW
│  (LLM · Auth · Payments · Email · Storage · Analytics) │
├─────────────────────────────────────────────────────┤
│   i18n / Localization Layer (strings · locale · RTL)   │  ← NEW
├─────────────────────────────────────────────────────┤
│              Shared Data & Auth Layer                 │  ← Supabase + PostgreSQL
└─────────────────────────────────────────────────────┘
```

### How the Products Talk to Each Other

- **GradeGuard → ScoreBoost AP:** When GradeGuard detects struggling with stoichiometry in AP Chem class, it automatically flags this in ScoreBoost AP so that unit gets prioritized in the AP prep plan.
- **StudySensei → GradeGuard:** When the AI tutor identifies a conceptual gap in integration by parts, GradeGuard schedules a 10-minute micro-review 2 days before the next Calc quiz.
- **SmartPack → All:** Squad members' collective performance data surfaces the most commonly missed concepts across the group.
- **All → Student Intelligence Profile:** Every interaction, quiz, session, and essay refines the AI's model of the student, making every recommendation sharper over time.
- **Subject-Type Rendering Layer → All Modules:** Detects subject context and activates the correct renderer — rich text for humanities, MathJax + canvas for STEM, audio/speech for foreign language.

---

## 🧩 Pluggable Architecture Blueprint

> **Engineering Mandate:** AceOS is built so that *every* external dependency is swappable without touching business logic. This section defines the abstraction contracts. Reference this during every sprint grooming when a new integration point is introduced.

### Provider Interface Map

| Domain | Interface Name | Phase 1 Default | Swap-In Alternatives | Config Key |
|---|---|---|---|---|
| **LLM — Grading** | `ILLMGradingProvider` | Gemini Flash → GPT-4o mini | GPT-4o, Claude 3.7, Mistral, Llama 3 | `LLM_GRADING_PROVIDER` |
| **LLM — Tutor** | `ILLMTutorProvider` | Groq (Llama 3.3 70B) | Claude 3.7, GPT-4o, Gemini Pro | `LLM_TUTOR_PROVIDER` |
| **LLM — Embeddings** | `IEmbeddingProvider` | Nomic Embed / text-embedding-3-small | Cohere Embed, Voyage AI, local GGUF | `EMBEDDING_PROVIDER` |
| **Auth** | `IAuthProvider` | Supabase Auth | Clerk, Auth0, NextAuth, Firebase Auth | `AUTH_PROVIDER` |
| **Database** | `IDBProvider` | Supabase (PostgreSQL) | PlanetScale, Neon, Railway Postgres | `DB_PROVIDER` |
| **File/Media Storage** | `IStorageProvider` | Cloudflare R2 | AWS S3, Supabase Storage, GCS | `STORAGE_PROVIDER` |
| **Email** | `IEmailProvider` | Resend | SendGrid, Postmark, AWS SES | `EMAIL_PROVIDER` |
| **Payments** | `IPaymentProvider` | Stripe | LemonSqueezy, Paddle, RevenueCat (mobile) | `PAYMENT_PROVIDER` |
| **Analytics** | `IAnalyticsProvider` | PostHog | Mixpanel, Amplitude, Segment | `ANALYTICS_PROVIDER` |
| **Feature Flags** | `IFeatureFlagProvider` | Config JSON / env vars | LaunchDarkly, Growthbook, Flagsmith | `FEATURE_FLAG_PROVIDER` |
| **FSRS Engine** | `IFSRSProvider` | `ts-fsrs` (TypeScript) | Custom FSRS-5, Python `fsrs` lib, server-side | `FSRS_PROVIDER` |
| **Search** | `ISearchProvider` | Postgres FTS + pgvector | Typesense, Algolia, Meilisearch | `SEARCH_PROVIDER` |
| **Rendering — Math** | `IMathRenderer` | MathJax 3 | KaTeX, MathML native | `MATH_RENDERER` |
| **Rendering — Diagrams** | `IDiagramRenderer` | Excalidraw embed / Canvas API | Konva.js, Fabric.js, tldraw | `DIAGRAM_RENDERER` |
| **Rendering — Audio/Speech** | `ISpeechProvider` | Web Speech API (browser-native) | Whisper API, Google STT, Deepgram | `SPEECH_PROVIDER` |
| **Push Notifications** | `INotificationProvider` | Resend (email) + browser push | Firebase FCM, OneSignal, Expo Push | `NOTIFICATION_PROVIDER` |

### Implementation Pattern (Every Provider)

```typescript
// providers/llm/ILLMGradingProvider.ts
export interface ILLMGradingProvider {
  gradeResponse(params: GradingParams): Promise<GradingResult>;
  getModelInfo(): ProviderMeta;
}

// providers/llm/OpenAIGradingProvider.ts
export class OpenAIGradingProvider implements ILLMGradingProvider { ... }

// providers/llm/GeminiGradingProvider.ts
export class GeminiGradingProvider implements ILLMGradingProvider { ... }

// config/providers.ts  ← THE ONLY FILE YOU CHANGE TO SWAP
export const gradingProvider: ILLMGradingProvider =
  process.env.LLM_GRADING_PROVIDER === 'openai'
    ? new OpenAIGradingProvider()
    : new GeminiGradingProvider();
```

> **Sprint Grooming Rule:** Any story introducing a new external service MUST begin with defining its `IProvider` interface first. The interface is the acceptance criteria. Implementation is the story. Swap-in is free.

---

## 🎨 Subject-Type Rendering Framework

> **Why this exists:** AP courses are not all text. AP Calculus needs LaTeX formula rendering and graph sketching. AP Biology needs labeled diagram tools. AP Spanish needs audio playback, pronunciation input, and accent-character keyboards. Building a one-size-fits-all content model fails all three. This framework defines the three rendering modes and how every feature must declare support for them.

### The Three Subject Rendering Modes

| Mode | `subjectType` Tag | AP Subjects | Core UI Needs | AI Grading Approach |
|---|---|---|---|---|
| **TEXT** | `TEXT` | AP Lang, AP Lit, AP US History, AP World History, AP Gov, AP Psych, AP Environmental Science (essay components) | Rich text editor, markdown rendering, annotation tools | LLM text analysis — rubric prompt injection, argument structure scoring |
| **VISUAL / STEM** | `VISUAL` | AP Calc AB/BC, AP Stats, AP Physics 1/2/C, AP Chem, AP Bio, AP Computer Science A | MathJax/KaTeX formula rendering, graph canvas, diagram annotation, step-by-step equation builder, free-body diagram tools | Multimodal LLM (vision + text) — evaluates both written work and diagram/graph accuracy |
| **LANGUAGE** | `LANGUAGE` | AP Spanish Language & Culture, AP French, AP Chinese, AP Japanese, AP Latin, AP Italian, AP German | Audio playback controls, speech input (microphone), pronunciation scoring, accent/special character keyboard, dual-script display (e.g., Hanzi + Pinyin) | Speech-to-text pipeline + LLM grammar/vocabulary scoring; pronunciation scored via phoneme comparison |

### Subject-Type Feature Support Matrix

Every feature built must be tagged against this matrix. Blank = not applicable. ✅ = required. ⏳ = future phase.

| Feature | TEXT | VISUAL/STEM | LANGUAGE |
|---|---|---|---|
| Question renderer | Rich text + Markdown | MathJax + Canvas + Image | Audio player + Script display |
| Student answer input | Text area / rich editor | Equation builder + Graph canvas + Drawing pad | Microphone + Text + Special char keyboard |
| AI grading | LLM rubric text analysis | Multimodal LLM (vision+text) | STT → LLM grammar/vocab scorer |
| Feedback display | Inline text annotations | Step-by-step equation correction + diagram overlay | Pronunciation score + grammar breakdown |
| FSRS card content | Text front/back | Formula image + rendered equation | Audio clip + target language text |
| Diagnostic questions | MCQ + short answer | MCQ + graph interpretation + equation solve | MCQ + listening comprehension + speaking prompt |
| Bluebook simulator | Text essay interface | Split-screen equation scratch pad | N/A (Bluebook doesn't cover language orals) |
| StudySensei tutor | Socratic text dialogue | Step-by-step equation walkthrough | Conversational dialogue in target language |
| FRQ grader | Essay/DBQ/LEQ grader | FRQ calculation + diagram grader | Spoken response grader ⏳ |
| Spaced rep card | Text card | Equation / diagram card | Audio card with speaking challenge |

### Subject-Type Data Model

Every question, card, and content item in the database carries a `subject_type` field. This drives rendering at runtime — no if/else chains in UI components.

```typescript
type SubjectType = 'TEXT' | 'VISUAL' | 'LANGUAGE';

interface Question {
  id: string;
  subject_type: SubjectType;         // drives renderer selection
  locale: string;                     // e.g. 'en', 'es', 'zh-Hans'
  content: QuestionContent;           // type-safe per SubjectType
  rubric: Rubric;
  ap_unit: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

// VISUAL type carries extra fields
interface VisualQuestionContent extends QuestionContent {
  latex?: string;                     // MathJax/KaTeX source
  diagram_url?: string;               // stored in R2
  graph_config?: GraphConfig;         // axes, labels, expected curve
  requires_drawing: boolean;          // triggers canvas input
}

// LANGUAGE type carries extra fields
interface LanguageQuestionContent extends QuestionContent {
  audio_url?: string;                 // listening prompt (R2)
  target_language: string;            // ISO 639-1 code
  requires_speech_input: boolean;     // triggers microphone
  script_display?: 'latin' | 'hanzi_pinyin' | 'hiragana_kanji' | 'cyrillic';
}
```

### i18n Architecture

| Layer | Implementation | Sprint |
|---|---|---|
| **UI Strings** | `next-intl` library — all hardcoded strings extracted to `/messages/{locale}.json` from Sprint 1 | Sprint 1 |
| **Content Locale** | `locale` field on every Question, Rubric, StudyPlan record | Sprint 1 (schema) |
| **AI Prompt Localization** | Prompt templates parameterized with `{target_language}` variable; separate system prompt per language course | Sprint 6 (FRQ grader) |
| **RTL Support** | Tailwind `dir="rtl"` + `rtl:` variant classes; relevant for AP Arabic/Hebrew if added in Phase 5 | Phase 5 |
| **Special Character Input** | Virtual keyboard component (`react-simple-keyboard`) with locale-specific key layouts; pluggable via `IKeyboardProvider` | Sprint 8 (Language mode) |
| **Audio Content CDN** | All language audio files stored in Cloudflare R2 with `/{locale}/{subject}/{unit}/` path structure | Sprint 8 |
| **TTS (Text-to-Speech)** | Pluggable `ISpeechProvider` — defaults to Web Speech API; swap to ElevenLabs/Google TTS for higher quality | Phase 3 |

> **Sprint Grooming Reminder:** When writing any story that touches question content, answer input, or AI grading — the story must specify `subject_type: TEXT | VISUAL | LANGUAGE`. Stories that say "build question component" without specifying subject type are **not groomed** and not sprint-ready.

---

## 📦 Suite Packaging & Pricing Strategy

| Tier | What's Included | Price | Target Buyer |
|---|---|---|---|
| **Free (Starter)** | GradeGuard (1 subject), ScoreBoost AP diagnostic only | $0 | Student/organic |
| **Student Pro** | All 4 modules, full AI features, all subject types (TEXT + VISUAL + LANGUAGE) | $24.99/mo or $179/yr | Parent/student |
| **Family Plan** | Student Pro for up to 3 kids | $34.99/mo or $249/yr | Parents |
| **School License** | All modules for all students, teacher dashboards | $8/student/mo | Schools/districts |
| **AP Sprint Pack** | ScoreBoost AP + StudySensei, 90-day AP season only | $59 one-time | Late-stage AP prep |
| **Language Add-On** *(Phase 3+)* | Full LANGUAGE mode for AP foreign language subjects | $4.99/mo add-on or included in Pro | Students taking AP language courses |

---

## 🗓️ PHASE 1: Beachhead (Months 1–6)
### Build ScoreBoost AP — Own the AP 5 Market

**Strategic Logic:** AP exam season is May 4–15 every year. Students are most desperate, most willing to pay, and most likely to evangelize if they score a 5. Launch with the 6 highest-enrollment AP exams: **AP Calc AB/BC** (VISUAL), **AP Bio** (VISUAL), **AP US History** (TEXT), **AP Lang** (TEXT), **AP Psych** (TEXT) — covering both TEXT and VISUAL subject types at launch. LANGUAGE mode (AP Spanish etc.) added in Phase 3.

---

### Phase 1 OKRs

**Objective 1:** Launch a product that meaningfully improves AP scores before May 2027 exams.
- KR1: 500 students complete a full AP diagnostic within 60 days of launch
- KR2: 70% of active users show measurable improvement (≥10% score gain) on practice tests after 4 weeks
- KR3: Average predicted AP score improves from 2.8 → 3.6 for active users by Week 8

**Objective 2:** Validate willingness to pay before building further.
- KR1: $5,000 MRR by Month 3
- KR2: $20,000 MRR by Month 6
- KR3: Net Promoter Score ≥ 55 by end of Phase 1

**Objective 3:** Establish the Student Intelligence Profile (SIP) data foundation.
- KR1: Collect ≥ 10,000 diagnostic question responses to train SIP model
- KR2: SIP accuracy validated — predicted vs. actual practice test score within ±0.4 points for 75% of users

---

### Phase 1 Epics & Feature Breakdown

#### 🔷 Epic 1.1 — AP Diagnostic Engine (Sprint 1–3 | Weeks 1–6)
`subject_types: TEXT, VISUAL` | *LANGUAGE mode: Phase 3*

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Subject Selector** | Student picks AP subject(s); top 6 at launch — system auto-tags each subject with its `SubjectType` | ALL | P0 |
| **50-Question Diagnostic** | College Board-aligned questions; TEXT subjects use rich-text MCQ; VISUAL subjects use MathJax-rendered equations + graph interpretation questions | TEXT + VISUAL | P0 |
| **Unit Heatmap** | Visual grid of all AP units colored Green/Yellow/Red based on diagnostic performance | ALL | P0 |
| **Predicted Score (1–5)** | Immediate post-diagnostic score prediction using weighted performance model | ALL | P0 |
| **Personalized Study Plan** | Auto-generated week-by-week plan from today → 2 weeks before AP exam | ALL | P0 |
| **VISUAL: Formula Renderer** | MathJax 3 renders all equations in STEM diagnostics; pluggable via `IMathRenderer` | VISUAL | P0 |
| **VISUAL: Graph Question Support** | Graph interpretation questions with image rendering + MCQ overlay | VISUAL | P0 |
| **"Where Are You" Benchmark** | Percentile rank vs. other AceOS users on same diagnostic | ALL | P1 |
| **Multi-Subject Dashboard** | Student tracks 2+ AP subjects simultaneously | ALL | P1 |

**Acceptance Criteria for Epic 1.1:** A student completes diagnostic → sees heatmap + predicted score + 8-week plan within 3 minutes. A VISUAL subject student sees properly rendered equations and graph questions. No plain-text fallback for VISUAL subjects.

> 🚧 **Sprint Grooming Note:** Story for "50-Question Diagnostic" must be split into two sub-stories: one for TEXT mode, one for VISUAL mode. They share the same FSRS schema but different content renderers. Do not combine into one story — they have different acceptance criteria and different content author workflows.

---

#### 🔷 Epic 1.2 — Adaptive Practice Engine with FSRS Spaced Repetition (Sprint 3–6 | Weeks 5–12)
`subject_types: TEXT, VISUAL` | *LANGUAGE (audio cards): Phase 3*

Spaced repetition using the **FSRS algorithm** is the gold standard — it produces 20–30% better retention per study hour than older SM-2 approaches. This is not flashcards — it's an intelligent question-delivery engine that renders content differently based on `SubjectType`.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **FSRS Adaptive Quiz Engine** | Questions scheduled at optimal intervals (1d → 3d → 1wk → 2wk) based on recall accuracy; pluggable via `IFSRSProvider` | ALL | P0 |
| **Concept-Level Tagging** | Every question tagged to specific AP unit + College Board learning objective + `SubjectType` | ALL | P0 |
| **TEXT: "Why Wrong?" Explainer** | After incorrect answer: AI explains concept from first principles using Socratic stepping | TEXT | P0 |
| **VISUAL: Step-by-Step Solution** | After incorrect STEM answer: AI renders step-by-step solution with MathJax equations and annotated diagrams | VISUAL | P0 |
| **VISUAL: Drawing Pad Review** | Student can sketch a graph or diagram as part of answer; AI provides annotated overlay showing correct vs. submitted | VISUAL | P1 |
| **Daily Review Queue** | "You have 12 cards due today across Calc AB and APUSH" — cards rendered per subject type | ALL | P0 |
| **Performance Streak** | Daily study streak tracker with science-backed nudges | ALL | P1 |
| **Weak Concept Drill Mode** | Rapid-fire session targeting Red-zone units; VISUAL subjects use equation-focused drill sequences | ALL | P1 |
| **Progress vs. Score Projection** | Live graph: "Based on this week's performance, your projected score moved from 3 → 3.4" | ALL | P1 |
| **Interleaving Mode** | Mixed-subject sessions every 5 questions — proven +23% long-term retention over blocked study | ALL | P2 |

**Key Technical Note:** FSRS (Free Spaced Repetition Scheduler) is open-source and research-validated. Implement FSRS-5 variant via `ts-fsrs`. The FSRS scheduler is subject-type-agnostic — it only scores recall; the renderer handles display.

> 🚧 **Sprint Grooming Note:** "Why Wrong? Explainer" must be split: TEXT version (LLM text response) vs. VISUAL version (LLM generates LaTeX step-by-step + optional diagram). These require different AI prompt templates and different UI components. Separate stories, shared interface.

---

#### 🔷 Epic 1.3 — FRQ / DBQ AI Grader (Sprint 5–8 | Weeks 9–16)
`subject_types: TEXT (Phase 1), VISUAL (Phase 1), LANGUAGE (Phase 3)`

This is the **single biggest market gap** in AP prep. Every student fears the free-response section. The grader must be subject-type-aware — an AP Calc FRQ is fundamentally different from an AP US History DBQ.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **FRQ Submission Portal** | Student types or uploads handwritten FRQ; VISUAL subjects support photo upload of handwritten math work | TEXT + VISUAL | P0 |
| **TEXT: Rubric-Aligned Essay Grader** | AI scores AP Lang synthesis, AP History DBQ/LEQ against exact College Board rubric; line-by-line feedback on thesis, evidence, analysis | TEXT | P0 |
| **VISUAL: Rubric-Aligned STEM Grader** | Multimodal AI (vision + text) evaluates AP Calc/Chem/Physics FRQ; scores both written setup AND mathematical execution; flags incorrect steps | VISUAL | P0 |
| **VISUAL: Equation OCR** | Handwritten math photo → OCR → structured equation → AI grading pipeline; pluggable via `IEquationOCRProvider` (default: GPT-4o Vision) | VISUAL | P0 |
| **Line-by-Line Feedback** | Actionable feedback per rubric point; VISUAL feedback includes annotated equation corrections | ALL | P0 |
| **Model Response** | Post-feedback: high-scoring model response with annotations; VISUAL shows fully worked solution with MathJax | ALL | P0 |
| **Revision Loop** | Revise and resubmit for a second score — tracks improvement delta | ALL | P1 |
| **FRQ Score History** | Timeline of FRQ scores per subject | ALL | P1 |
| **AP-Specific Prompt Library** | 200+ past AP FRQ prompts catalogued by year and unit; tagged by `SubjectType` | ALL | P1 |
| **Voice Dictation (TEXT subjects)** | Student speaks TEXT response; AI transcribes and grades via `ISpeechProvider` | TEXT | P2 |
| **LANGUAGE: Spoken Response Grader** | STT pipeline + LLM grammar/vocab/fluency scorer for AP Spanish speaking FRQ | LANGUAGE | Phase 3 |

**AI Implementation Note:** Use multimodal LLM (GPT-4o or Gemini 1.5 Pro) for VISUAL grading — must support image input. TEXT grading can use text-only models (cheaper). Route by `subject_type` at the provider layer — never hardcode model selection in business logic.

> 🚧 **Sprint Grooming Note:** FRQ Grader is three separate epics in disguise: TEXT grader, VISUAL grader, LANGUAGE grader. Phase 1 ships TEXT + VISUAL. Each has its own AI prompt template, its own rubric schema, and its own UI input component. Stories must not be combined across subject types.

---

#### 🔷 Epic 1.4 — Bluebook™ Digital Exam Simulator (Sprint 7–9 | Weeks 13–18)
`subject_types: TEXT, VISUAL` | *LANGUAGE: N/A (Bluebook doesn't cover AP language orals)*

AP exams are now fully/hybrid digital via Bluebook. No competitor has built a proper Bluebook-style interface. This is a 6-month first-mover window.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Full-Length Timed Practice Exam** | 3-hour+ timed exam in Bluebook-style UI with section timer, progress bar, and question navigator | ALL | P0 |
| **TEXT: Essay Interface** | Split-screen view: source documents (for DBQ) on left, text editor on right — mirrors real Bluebook AP History/Lang experience | TEXT | P0 |
| **VISUAL: Equation Scratch Pad** | Split-screen: problem on left, equation scratch pad + answer input on right; MathJax renders problem; student types or draws solution | VISUAL | P0 |
| **VISUAL: Graph Annotation Tools** | Drag-to-draw curve tools, axis labeling, point plotting — for AP Calc, AP Physics, AP Stats graph questions | VISUAL | P0 |
| **Digital Annotation Tools** | Highlight, strikethrough, flag for review — same tools as real Bluebook | ALL | P0 |
| **Distraction-Free Mode** | Full-screen lock mode to simulate real exam environment | ALL | P1 |
| **Post-Exam Report** | Full score breakdown by unit after exam completion; weak areas flagged into study plan | ALL | P0 |
| **Retake Scheduler** | System automatically schedules next full-length exam 2 weeks later with fresh question set | ALL | P1 |
| **Score Trend Graph** | Full-exam scores plotted over time — visual progress toward a 5 | ALL | P1 |

> 🚧 **Sprint Grooming Note:** The Bluebook simulator has fundamentally different UX for TEXT vs. VISUAL subjects. Sprint 7 builds TEXT exam interface (AP Lang, APUSH). Sprint 8 builds VISUAL exam interface (AP Calc, AP Bio). Same timer/navigation shell, different content panes. Plan two separate design specs.

---

#### 🔷 Epic 1.5 — Onboarding, Auth & Core Infrastructure (Sprint 1–2 | Weeks 1–4)
`subject_types: ALL` | *This epic is the foundation — must be pluggable and i18n-ready from day one*

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Student Onboarding Flow** | Grade level → AP subjects → exam date → diagnostic trigger; system assigns `SubjectType` to each selected subject automatically | ALL | P0 |
| **Parent Onboarding** | Optional parent account link — weekly email summary of student progress via `IEmailProvider` | ALL | P1 |
| **Google/Apple SSO** | Frictionless auth via `IAuthProvider` (default: Supabase Auth); swap to Clerk/Auth0 via config | ALL | P0 |
| **Subscription & Paywall** | Free tier → Pro upgrade via `IPaymentProvider` (default: Stripe); swap to LemonSqueezy via config | ALL | P0 |
| **Student Intelligence Profile v0.1** | Initial SIP seed from diagnostic data — stores learning pace, subject type preferences, weak units, predicted score | ALL | P0 |
| **Feature Flag System** | Central config/env-driven feature flag system via `IFeatureFlagProvider`; every subject module, renderer, and provider gated behind a flag | ALL | P0 |
| **i18n Scaffold** | `next-intl` installed and all UI strings extracted to `/messages/en.json`; locale-aware routing set up even if only `en` ships at launch | ALL | P0 |
| **Provider Config File** | `config/providers.ts` created — single file mapping all env vars to concrete provider implementations; never hardcode providers in feature code | ALL | P0 |

**Acceptance Criteria for Epic 1.5:** A developer can swap any provider (auth, email, payments, LLM) by changing a single env var with zero code changes. All UI strings are in `/messages/en.json`. Feature flags gate all subject modules.

> 🚧 **Sprint Grooming Note:** The `config/providers.ts` and `IFeatureFlagProvider` stories are **blocking stories** — they must be completed in Sprint 1, Week 1, before any other feature story begins. No feature story is sprint-ready if it imports a vendor SDK directly rather than going through a provider interface.

---

### Phase 1 — Sprint Schedule

| Sprint | Weeks | Focus | Deliverable | Subject Types Active |
|---|---|---|---|---|
| Sprint 1 | 1–2 | Auth, DB schema, provider config scaffold, i18n scaffold, feature flags, onboarding flow | Working login + subject selector + pluggable provider layer live | ALL |
| Sprint 2 | 3–4 | Diagnostic engine (TEXT) + Unit Heatmap | 50Q TEXT diagnostic live for AP Lang, AP Psych, AP US History | TEXT |
| Sprint 3 | 5–6 | Diagnostic engine (VISUAL) + MathJax renderer + Score predictor + Study plan generator | 50Q VISUAL diagnostic live for AP Calc AB; personalized 8-week plan | VISUAL |
| Sprint 4 | 7–8 | FSRS engine + Daily review queue (TEXT + VISUAL) | Adaptive quiz system live for both subject types | TEXT + VISUAL |
| Sprint 5 | 9–10 | TEXT "Why Wrong?" explainer + VISUAL step-by-step solution + Weak drill mode | Full practice loop complete for both subject types | TEXT + VISUAL |
| Sprint 6 | 11–12 | FRQ grader MVP — TEXT (AP Lang essay + APUSH DBQ) + VISUAL (AP Calc FRQ + Equation OCR) | First AI-graded FRQ submissions across both subject types | TEXT + VISUAL |
| Sprint 7 | 13–14 | Bluebook simulator — TEXT exam interface (MCQ + essay section) | Timed digital TEXT exam live | TEXT |
| Sprint 8 | 15–16 | Bluebook simulator — VISUAL exam interface (MCQ + equation scratch pad + graph tools) | Full exam simulator live for VISUAL subjects | VISUAL |
| Sprint 9 | 17–18 | Payment flow via `IPaymentProvider`, free/pro tiers, parent dashboard, email via `IEmailProvider` | Monetization live | ALL |
| Sprint 10 | 19–20 | Remaining AP subjects (AP Bio VISUAL, AP Chem VISUAL, AP Psych TEXT — full question banks) | 6 AP subjects fully supported | TEXT + VISUAL |
| Sprint 11 | 21–22 | Performance optimization, load testing, provider swap drills, UAT | Load-tested, UAT complete, provider swaps validated | ALL |
| Sprint 12 | 23–24 | Soft launch (California only) | 🚀 Public launch Month 6 | TEXT + VISUAL |

---

## 🛠️ Phase 1 — Tech Stack

> Every technology listed below is the **Phase 1 default**. The swap-in column shows what you change to via `config/providers.ts` as you scale. No other code changes required.

### Frontend

| Layer | Technology | Pluggable Interface | Swap-In | Config Key |
|---|---|---|---|---|
| **Framework** | Next.js 15 (App Router) | — | SvelteKit, Remix (major refactor — low priority) | — |
| **Styling** | Tailwind CSS v4 + shadcn/ui | — | — | — |
| **State Management** | Zustand | — | Jotai, Redux Toolkit | — |
| **i18n** | `next-intl` | `ILocaleProvider` | `react-i18next`, `lingui` | `I18N_PROVIDER` |
| **Math Rendering (VISUAL)** | MathJax 3 | `IMathRenderer` | KaTeX, MathML | `MATH_RENDERER` |
| **Diagram / Drawing (VISUAL)** | Excalidraw embed + HTML Canvas API | `IDiagramRenderer` | Konva.js, Fabric.js, tldraw | `DIAGRAM_RENDERER` |
| **Rich Text Editor (TEXT)** | Tiptap (ProseMirror-based) | `ITextEditorProvider` | Quill, Lexical (Meta) | `TEXT_EDITOR_PROVIDER` |
| **Audio Playback (LANGUAGE)** | HTML5 `<audio>` + custom controls | `IAudioPlayer` | Howler.js | `AUDIO_PLAYER` |
| **Speech Input (LANGUAGE)** | Web Speech API (`SpeechRecognition`) | `ISpeechProvider` | Whisper API, Deepgram, Google STT | `SPEECH_PROVIDER` |
| **Special Char Keyboard (LANGUAGE)** | `react-simple-keyboard` | `IKeyboardProvider` | Custom virtual keyboard | `KEYBOARD_PROVIDER` |
| **Charts / Analytics UI** | Recharts | — | Chart.js, Nivo | — |
| **Animations** | Framer Motion | — | — | — |

### Backend

| Layer | Technology | Pluggable Interface | Swap-In | Config Key |
|---|---|---|---|---|
| **API Layer** | Next.js API Routes + Server Actions | — | Separate Express/Fastify service (Phase 4+) | — |
| **Database** | Supabase (PostgreSQL) | `IDBProvider` | Neon, PlanetScale, Railway Postgres | `DB_PROVIDER` |
| **Auth** | Supabase Auth (Google + Apple SSO) | `IAuthProvider` | Clerk, Auth0, NextAuth | `AUTH_PROVIDER` |
| **ORM** | Drizzle ORM | — | Prisma | — |
| **File / Media Storage** | Cloudflare R2 | `IStorageProvider` | AWS S3, Supabase Storage, GCS | `STORAGE_PROVIDER` |
| **FSRS Engine** | `ts-fsrs` (TypeScript, client+server) | `IFSRSProvider` | Python `fsrs` microservice, custom FSRS-5 | `FSRS_PROVIDER` |
| **Vector Search** | pgvector (Supabase extension) | `ISearchProvider` | Pinecone, Weaviate, Typesense | `SEARCH_PROVIDER` |
| **Background Jobs** | Supabase Edge Functions + pg_cron | `IJobQueueProvider` | Inngest, Trigger.dev, BullMQ | `JOB_QUEUE_PROVIDER` |
| **Realtime** | Supabase Realtime | — | Ably, Pusher, Soketi | — |

### AI / ML

| Layer | Technology | Pluggable Interface | Swap-In | Config Key |
|---|---|---|---|---|
| **LLM — Grading (TEXT)** | GPT-4o mini (cost-optimized) | `ILLMGradingProvider` | Claude 3.5 Haiku, Gemini Flash | `LLM_GRADING_PROVIDER` |
| **LLM — Grading (VISUAL)** | GPT-4o (multimodal, vision+text) | `ILLMGradingProvider` | Gemini 1.5 Pro, Claude 3.7 Sonnet | `LLM_GRADING_PROVIDER` |
| **LLM — Tutor / Socratic** | Groq + Llama 3.3 70B (low latency) | `ILLMTutorProvider` | GPT-4o, Claude 3.7, Gemini Pro | `LLM_TUTOR_PROVIDER` |
| **LLM — Language Grading** | GPT-4o + multilingual prompt templates | `ILLMGradingProvider` | Claude 3.7, Gemini 1.5 Pro | `LLM_GRADING_PROVIDER` |
| **Embeddings** | `text-embedding-3-small` (OpenAI) | `IEmbeddingProvider` | Nomic Embed, Cohere Embed, Voyage AI | `EMBEDDING_PROVIDER` |
| **Equation OCR (VISUAL)** | GPT-4o Vision | `IEquationOCRProvider` | Mathpix API, Google Vision AI | `EQUATION_OCR_PROVIDER` |
| **Speech-to-Text (LANGUAGE)** | Web Speech API (browser) | `ISpeechProvider` | OpenAI Whisper API, Deepgram, Google STT | `SPEECH_PROVIDER` |
| **AI SDK / Routing** | Vercel AI SDK (`ai` package) | — | LangChain.js (if agent complexity grows) | — |

### Infrastructure & DevOps

| Layer | Technology | Pluggable Interface | Swap-In | Config Key |
|---|---|---|---|---|
| **Hosting** | Vercel (Next.js optimized) | — | Railway, Fly.io, AWS Amplify | — |
| **CDN / Edge** | Vercel Edge Network + Cloudflare R2 | — | AWS CloudFront | — |
| **Email** | Resend | `IEmailProvider` | SendGrid, Postmark, AWS SES | `EMAIL_PROVIDER` |
| **Payments** | Stripe | `IPaymentProvider` | LemonSqueezy, Paddle, RevenueCat | `PAYMENT_PROVIDER` |
| **Analytics** | PostHog (self-hostable) | `IAnalyticsProvider` | Mixpanel, Amplitude, Segment | `ANALYTICS_PROVIDER` |
| **Error Monitoring** | Sentry | — | Datadog, Highlight.run | — |
| **Feature Flags** | Env vars + config JSON | `IFeatureFlagProvider` | LaunchDarkly, Growthbook, Flagsmith | `FEATURE_FLAG_PROVIDER` |
| **CI/CD** | GitHub Actions | — | — | — |
| **Secrets Management** | Vercel Environment Variables | — | Doppler, AWS Secrets Manager | — |

### Codebase Directory Structure

```
aceos/
├── app/                        # Next.js App Router pages
├── components/
│   ├── renderers/              # SubjectType-specific renderers
│   │   ├── TextRenderer.tsx    # TEXT mode — rich text, markdown
│   │   ├── VisualRenderer.tsx  # VISUAL mode — MathJax, canvas, diagrams
│   │   └── LanguageRenderer.tsx # LANGUAGE mode — audio, speech, keyboard
│   ├── ui/                     # shadcn/ui base components
│   └── shared/                 # Subject-type-agnostic shared components
├── providers/                  # ALL pluggable provider implementations
│   ├── llm/
│   │   ├── ILLMGradingProvider.ts
│   │   ├── OpenAIGradingProvider.ts
│   │   └── GeminiGradingProvider.ts
│   ├── auth/
│   ├── storage/
│   ├── email/
│   ├── payment/
│   ├── speech/
│   ├── fsrs/
│   └── analytics/
├── config/
│   ├── providers.ts            # ← THE ONLY FILE TO CHANGE FOR ANY SWAP
│   ├── subjects.ts             # Subject → SubjectType mapping
│   └── feature-flags.ts        # Feature flag definitions
├── messages/                   # i18n locale files
│   ├── en.json
│   ├── es.json                 # Added Phase 3
│   └── zh-Hans.json            # Added Phase 3
├── lib/
│   ├── fsrs/                   # FSRS-5 scheduling logic
│   ├── ai/                     # AI prompt templates per subject type
│   └── db/                     # Drizzle schema + queries
└── public/
    └── audio/                  # Static audio assets (Phase 3+)
```

> **Sprint Grooming Rule:** Any new component added to `components/` must declare its `subjectType` support in a JSDoc comment at the top. Any new file in `lib/ai/` must specify which LLM provider interface it uses. No direct SDK imports outside of `providers/`.

---

## 🗓️ PHASE 2: Expand (Months 7–12)
### Launch GradeGuard — Own the Daily GPA Layer

**Strategic Logic:** Phase 1 proves we can own the AP season. Phase 2 makes AceOS sticky 365 days a year. GradeGuard connects every class assignment, quiz, and test to the student's GPA arc — and bridges daily classroom performance directly into ScoreBoost AP prep. A student who uses GradeGuard daily is 4x more likely to retain the AP prep habit year-round.

---

### Phase 2 OKRs

**Objective 1:** Make AceOS a daily habit — not just an AP season tool.
- KR1: 60% of Phase 1 users activate GradeGuard within 30 days of Phase 2 launch
- KR2: Average session frequency increases from 3x/week → 5x/week for GradeGuard users
- KR3: 7-day retention rate improves from 45% → 65% after GradeGuard activation

**Objective 2:** Drive GPA outcomes that create word-of-mouth.
- KR1: 40% of active GradeGuard users improve GPA by ≥0.3 points within one semester
- KR2: Parent satisfaction score ≥ 4.5/5 on weekly progress email NPS
- KR3: 200+ parent-driven referrals tracked via referral attribution by Month 12

**Objective 3:** Grow MRR through expanded retention and upsells.
- KR1: $50,000 MRR by Month 9
- KR2: $100,000 MRR by Month 12
- KR3: Annual plan conversion rate ≥ 30% of new Pro subscribers

---

### Phase 2 Epics & Feature Breakdown

#### 🔷 Epic 2.1 — Grade Tracker & GPA Calculator (Sprint 13–14 | Weeks 25–28)
`subject_types: ALL` | *GradeGuard is subject-type-agnostic at the grade-entry layer; subject type matters at the study recommendation layer*

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Class Setup** | Student adds classes: name, teacher, grading scale (weighted/unweighted), grade categories (tests, HW, quizzes) with custom weights | ALL | P0 |
| **Assignment Entry** | Log grades per assignment; system auto-calculates category average and running GPA | ALL | P0 |
| **Live GPA Calculator** | Real-time weighted/unweighted GPA calculation across all classes; supports 4.0 and 5.0 scale | ALL | P0 |
| **GPA Arc Chart** | Visual chart: current GPA trajectory plotted against target GPA — "You need a 91 on your next Calc test to hit 3.8" | ALL | P0 |
| **What-If Grade Simulator** | "What grade do I need on the final to get an A?" — instant scenario calculation | ALL | P0 |
| **Grade Import (Photo)** | Student photos a graded test/paper; OCR extracts score; auto-logs to correct class via `IEquationOCRProvider` | ALL | P1 |
| **LMS Integration (Phase 4)** | Canvas, Schoology, Google Classroom grade sync via `ILMSProvider` | ALL | Phase 4 |
| **Grade Trend Alerts** | "Your AP Chem grade dropped 8 points this week" — triggers ScoreBoost AP focus adjustment | ALL | P0 |
| **Semester GPA Projection** | Projected end-of-semester GPA based on current trajectory | ALL | P1 |

**Acceptance Criteria for Epic 2.1:** Student adds 5 classes → logs 10 grades → sees live GPA + arc chart + what-if scenario in under 2 minutes. Grade trend alert fires within 24 hours of a significant grade drop.

> 🚧 **Sprint Grooming Note:** "Grade Import (Photo)" depends on `IEquationOCRProvider` already defined in Phase 1 for VISUAL FRQ grading — reuse the same provider interface. Do not create a new OCR abstraction. Story is blocked until `IEquationOCRProvider` is confirmed live from Phase 1.

---

#### 🔷 Epic 2.2 — AI Study Recommendation Engine (Sprint 14–15 | Weeks 27–30)
`subject_types: TEXT, VISUAL, LANGUAGE`

This is where GradeGuard and ScoreBoost AP become one brain. The SIP (Student Intelligence Profile) reads GradeGuard signals and adjusts AP prep priorities in real time.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Cross-Module Signal Bridge** | GradeGuard grade drops automatically flag corresponding AP units in ScoreBoost; SIP connects classroom performance to exam readiness | ALL | P0 |
| **Daily Study Agenda** | "Today: 20 min Calc AB FSRS review (3 cards due) + 10 min re-read Unit 4 notes (grade dropped)" — personalized per subject type | ALL | P0 |
| **Micro-Review Scheduler** | When GradeGuard detects an upcoming test in 48h, schedules a 15-min targeted review session pulling from ScoreBoost AP question bank | ALL | P0 |
| **TEXT: Essay Weakness Detector** | Detects pattern of low thesis scores in TEXT subjects → schedules a StudySensei Socratic session on argumentation | TEXT | P1 |
| **VISUAL: Concept Gap Detector** | Detects pattern of wrong equation setups in VISUAL subjects → queues VISUAL step-by-step drill sessions | VISUAL | P1 |
| **Burnout Risk Index** | SIP monitors study load vs. grade trend; alerts student + parent when burnout risk is high | ALL | P1 |
| **Weekly Intelligent Summary** | Auto-generated weekly email to parent: GPA status, AP score projection, top 3 weak concepts, study time logged | ALL | P0 |
| **Study Time Tracker** | Logs active time in app per subject per day; surfaces "You studied 3.2 hrs this week — here's your efficiency score" | ALL | P1 |

> 🚧 **Sprint Grooming Note:** "Cross-Module Signal Bridge" is a backend-first story — it requires a `signals` table in the DB and a pub/sub event pattern (Supabase Realtime or pg_notify) before any UI can be built. This story must be groomed as two sub-stories: (1) backend signal emission, (2) frontend signal consumption. Do not combine.

---

#### 🔷 Epic 2.3 — Parent Dashboard & Accountability Layer (Sprint 15–16 | Weeks 29–32)
`subject_types: ALL`

Parents are the **paying customer** in 80% of high school edtech purchases. Giving parents visibility without creating surveillance anxiety is the product design challenge here.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Parent Account Link** | Parent creates account and links to student via invite code; student controls what data is visible | ALL | P0 |
| **Parent Dashboard** | High-level view: GPA trend, AP score projection, weekly study time, top 3 weak concepts | ALL | P0 |
| **Weekly Progress Email** | Auto-sent every Sunday via `IEmailProvider`; includes GPA delta, AP projection, and one actionable insight | ALL | P0 |
| **Grade Alert Notifications** | Parent notified via email/push when grade drops >5 points in any class; pluggable via `INotificationProvider` | ALL | P1 |
| **Study Time Visibility** | Parent sees weekly study hours logged; no granular session surveillance — summary only | ALL | P1 |
| **Referral Program** | "Refer another parent, get 1 month free" — tracked via referral attribution system | ALL | P1 |
| **Parent-Student Shared Goals** | Parent and student co-set GPA and AP score targets; AI adjusts recommendations to hit shared goal | ALL | P2 |

**Design Note:** The parent dashboard must be explicitly framed as *insight*, not *surveillance*. Student controls visibility toggles. This is a trust feature — not a tracking feature. Copy and UX must reflect this.

> 🚧 **Sprint Grooming Note:** "Weekly Progress Email" requires the `IEmailProvider` and the `INotificationProvider` interfaces already live from Phase 1. Reuse existing providers — do not create new email abstractions. Template must be i18n-ready (`/messages/en.json` keys) from day one.

---

#### 🔷 Epic 2.4 — Student Intelligence Profile v1.0 (Sprint 16–17 | Weeks 31–34)
`subject_types: ALL`

The SIP is the core moat of AceOS. By Phase 2, it has 6+ months of data across AP diagnostics, FRQ submissions, daily practice, grade trends, and study patterns. Version 1.0 makes SIP actionable — it stops being a data store and starts being a recommendation engine.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **SIP Dashboard** | Student-facing view of their own intelligence profile: learning pace, strongest/weakest subject types, study pattern analysis, burnout risk | ALL | P0 |
| **Adaptive Difficulty Engine** | FSRS question difficulty auto-adjusts based on SIP — faster learners get harder questions sooner | ALL | P0 |
| **Subject-Type Learning Style Tag** | SIP tags student as "VISUAL-dominant" or "TEXT-dominant" based on comparative performance; adjusts study plan weightings | ALL | P1 |
| **AP Score Confidence Interval** | "Based on your performance, you have a 73% chance of scoring a 4 or 5 on AP Calc AB" — updates weekly | ALL | P0 |
| **Long-Term GPA Projection** | SIP projects GPA trajectory through end of junior year based on current trend | ALL | P1 |
| **Concept Knowledge Graph** | Visual graph of all AP concepts — green = mastered, yellow = shaky, red = unknown; edges show prerequisite relationships | ALL | P2 |
| **SIP API (Internal)** | Clean internal API for all modules to read/write SIP data; no module reads raw SIP tables directly | ALL | P0 |

**Technical Note:** The SIP API must be a proper internal service boundary — not a shared table that modules query directly. Every read/write goes through `lib/sip/SIPService.ts`. This prevents SIP from becoming a spaghetti dependency as the suite grows.

> 🚧 **Sprint Grooming Note:** "SIP API (Internal)" is a **blocking story** for every other SIP feature in this epic. It must be completed first. The SIP schema was seeded in Phase 1 (Epic 1.5) — Phase 2 formalizes it into a proper service layer.

---

#### 🔷 Epic 2.5 — GradeGuard Mobile PWA (Sprint 17–18 | Weeks 33–36)
`subject_types: ALL`

Students log grades on their phones — immediately after getting a test back in class. The web app must be PWA-ready with offline grade entry and push notifications.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **PWA Install Prompt** | "Add AceOS to Home Screen" prompt on mobile; service worker caches core shell | ALL | P0 |
| **Offline Grade Entry** | Student logs grade offline; syncs to Supabase when back online via background sync | ALL | P0 |
| **Push Notifications (Mobile)** | Daily study reminder, grade drop alert, streak reminder via `INotificationProvider` (browser push); swap to FCM for native app later | ALL | P0 |
| **Mobile-Optimized Grade View** | Touch-friendly grade entry form; swipe to delete/edit assignments | ALL | P0 |
| **Quick-Log Widget** | One-tap grade entry from home screen: class → score → done in 3 taps | ALL | P1 |
| **Biometric Auth** | Face ID / fingerprint login on supported devices via browser WebAuthn API | ALL | P1 |

> 🚧 **Sprint Grooming Note:** PWA does NOT mean native app. Do not scope React Native in Phase 2. The PWA covers 90% of mobile use cases (grade logging, review queue, notifications) at zero additional build cost. Native iOS/Android is Phase 5 if PWA engagement data supports it.

---

### Phase 2 — Sprint Schedule

| Sprint | Weeks | Focus | Deliverable | Subject Types Active |
|---|---|---|---|---|
| Sprint 13 | 25–26 | GradeGuard class setup + assignment entry + live GPA calculator | Grade tracker live; student can log grades and see GPA | ALL |
| Sprint 14 | 27–28 | GPA arc chart + what-if simulator + grade trend alerts + cross-module signal bridge (backend) | GPA arc visible; alert fires on grade drop; SIP signal bridge live | ALL |
| Sprint 15 | 29–30 | Daily study agenda + micro-review scheduler + cross-module signal bridge (frontend) | Unified daily agenda combining GradeGuard + ScoreBoost AP signals | ALL |
| Sprint 16 | 31–32 | Parent dashboard + weekly progress email + parent account link | Parents can view student progress; weekly email fires every Sunday | ALL |
| Sprint 17 | 33–34 | SIP v1.0 — adaptive difficulty + AP score confidence interval + SIP API | SIP fully operational as internal service; confidence intervals live | ALL |
| Sprint 18 | 35–36 | GradeGuard PWA — offline grade entry + push notifications + mobile UI polish | PWA installable; offline grade sync works; push notifications fire | ALL |

---

## 🗓️ PHASE 3: Deepen (Months 13–18)
### Launch StudySensei + Full LANGUAGE Mode

**Strategic Logic:** Phase 3 unlocks two things simultaneously: (1) StudySensei — the AI Socratic tutor that turns passive review into active mastery dialogue, and (2) LANGUAGE mode — the third and final subject-type renderer, unlocking AP Spanish, French, Chinese, Japanese, and more. Together they make AceOS the only AP prep tool that handles every subject type with a dedicated AI tutor.

---

### Phase 3 OKRs

**Objective 1:** Make StudySensei the most-used feature in AceOS.
- KR1: 70% of active users engage with StudySensei at least once per week by Month 15
- KR2: Average session length increases from 12 min → 22 min after StudySensei activation
- KR3: Users who complete a StudySensei session score 18% higher on the following practice quiz (validated via A/B test)

**Objective 2:** Own the AP Foreign Language prep market.
- KR1: 1,000 AP Spanish students activate LANGUAGE mode within 60 days of launch
- KR2: AP Spanish diagnostic completion rate ≥ 65% (vs. 72% for TEXT subjects — acceptable delta given audio dependency)
- KR3: Language Add-On converts at ≥ 12% of eligible free users

**Objective 3:** Scale MRR with new subject types and tutor upsell.
- KR1: $150,000 MRR by Month 15
- KR2: $250,000 MRR by Month 18
- KR3: Churn rate drops below 6%/month after StudySensei activation (vs. 11% without)

---

### Phase 3 Epics & Feature Breakdown

#### 🔷 Epic 3.1 — StudySensei AI Socratic Tutor (Sprint 19–22 | Weeks 37–44)
`subject_types: TEXT, VISUAL, LANGUAGE`

StudySensei is not a chatbot. It is a Socratic tutor — it never gives the answer directly. It asks questions that guide the student to the answer themselves. This is the single most evidence-backed tutoring methodology for long-term retention.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Socratic Dialogue Engine** | AI tutor responds to student questions with guided questions, not direct answers; uses chain-of-thought prompting internally but surfaces only Socratic turns to student | ALL | P0 |
| **TEXT: Essay Argumentation Coach** | Student pastes a draft thesis or argument; AI coaches line-by-line with Socratic questions — "What evidence supports this claim?" | TEXT | P0 |
| **VISUAL: Equation Walkthrough Mode** | Student inputs a problem; AI walks through step-by-step with rendered MathJax, asking the student to complete each step before revealing the next | VISUAL | P0 |
| **LANGUAGE: Target-Language Dialogue** | Student converses with AI tutor entirely in target language (Spanish, French, etc.); AI corrects grammar/vocab inline without breaking immersion | LANGUAGE | P0 |
| **Session Memory** | AI tutor remembers what was covered in the last 5 sessions; builds on prior explanations; avoids re-explaining mastered concepts | ALL | P0 |
| **"Explain Like I'm 10" Mode** | Student can request simpler explanation; AI adjusts complexity level via prompt injection | ALL | P1 |
| **Concept Connection Map** | After session: AI surfaces 3 related concepts the student should review next, linked to FSRS queue | ALL | P1 |
| **Tutor Session History** | Full transcript of all past sessions, searchable by subject and concept | ALL | P1 |
| **VISUAL: Live Equation Scratch Pad** | Student and tutor share a live equation scratch pad during session; student writes, AI annotates | VISUAL | P1 |
| **LANGUAGE: Pronunciation Feedback** | AI listens to student speak in target language via `ISpeechProvider`; scores pronunciation and gives phoneme-level feedback | LANGUAGE | P1 |
| **Tutoring Session Caps (Free tier)** | Free users get 3 StudySensei sessions/month; Pro users get unlimited | ALL | P0 |

**AI Implementation Note:** StudySensei uses `ILLMTutorProvider` (default: Groq + Llama 3.3 70B for low-latency streaming). LANGUAGE mode switches to multilingual-capable model (GPT-4o or Claude 3.7). Session memory stored in Supabase with pgvector embeddings for semantic session recall.

> 🚧 **Sprint Grooming Note:** "Socratic Dialogue Engine" is the foundation story — it must ship before any subject-type-specific tutor story begins. The engine is subject-type-agnostic at the LLM layer; subject type only affects the renderer (what the student sees alongside the dialogue). Separate stories: TEXT tutor UI, VISUAL tutor UI, LANGUAGE tutor UI.

---

#### 🔷 Epic 3.2 — LANGUAGE Mode: AP Foreign Language Full Stack (Sprint 21–24 | Weeks 41–48)
`subject_types: LANGUAGE`

This is the third and final subject-type renderer. AP Spanish Language is the #2 most-taken AP exam nationally. No competitor has native audio, speech input, pronunciation scoring, and target-language AI tutoring in one product. This is the moat.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **LANGUAGE Diagnostic** | 50-question AP Spanish/French diagnostic with listening comprehension (audio MCQ), reading (text MCQ), and speaking prompts; all audio served from Cloudflare R2 | LANGUAGE | P0 |
| **Audio Question Renderer** | `LanguageRenderer.tsx` — HTML5 audio player with playback controls, transcript toggle, speed control (0.75x / 1x / 1.25x) | LANGUAGE | P0 |
| **Speech Input + STT** | Microphone capture via `ISpeechProvider`; transcribes student's spoken response; feeds into AI grading pipeline | LANGUAGE | P0 |
| **Pronunciation Scorer** | Phoneme-level comparison of student speech vs. native speaker target; score per phoneme cluster; visual feedback on problem sounds | LANGUAGE | P0 |
| **Special Character Keyboard** | Virtual keyboard overlay for Spanish (ñ, á, é, í, ó, ú, ü, ¿, ¡), French (à, â, ç, è, ê, ë, î, ï, ô, ù, û), Chinese (Pinyin input + Hanzi display), Japanese (Hiragana + Kanji) | LANGUAGE | P0 |
| **Dual-Script Display** | For AP Chinese/Japanese: question and answer rendered in both scripts side-by-side (Hanzi + Pinyin; Kanji + Hiragana) | LANGUAGE | P0 |
| **LANGUAGE FSRS Cards** | Audio-front / text-back spaced repetition cards; student hears audio prompt → recalls written or spoken answer | LANGUAGE | P0 |
| **Spoken FRQ Grader** | Student records spoken response to AP Spanish/French presentational speaking task; AI scores on fluency, grammar, vocabulary, task completion | LANGUAGE | P0 |
| **Interpersonal Speaking Simulator** | AI plays the role of conversation partner in target language; student responds; AI grades turn-by-turn | LANGUAGE | P1 |
| **Audio Content Library** | 500+ curated audio clips per AP language subject (native speaker narration, news excerpts, conversation samples) stored in R2 | LANGUAGE | P1 |
| **LANGUAGE Bluebook Simulator** | AP Spanish/French written sections in Bluebook-style UI; listening section with audio player; no oral section (Bluebook limitation) | LANGUAGE | P1 |
| **es.json / zh-Hans.json locale files** | UI strings for Spanish and Simplified Chinese added to `/messages/`; all AP language UI rendered in target language option | LANGUAGE | P1 |

**Technical Note:** Audio files follow strict CDN path structure: `/{locale}/{subject}/{unit}/{file_id}.mp3`. All audio URLs stored in DB as relative paths — never hardcoded. STT defaults to Web Speech API; swap to OpenAI Whisper for higher accuracy via `ISpeechProvider`.

> 🚧 **Sprint Grooming Note:** LANGUAGE mode ships AP Spanish first (highest enrollment), then AP French, AP Chinese, AP Japanese in that order. Each language is feature-flagged independently via `IFeatureFlagProvider` — you can ship Spanish without French being ready. Do not block all languages on one story.

---

#### 🔷 Epic 3.3 — AP Content Expansion (Sprint 22–23 | Weeks 43–46)
`subject_types: TEXT, VISUAL, LANGUAGE`

Phase 1 launched 6 AP subjects. Phase 3 expands to the top 20 by enrollment, covering all three subject types.

| AP Subject | Subject Type | Enrollment Rank | Sprint |
|---|---|---|---|
| AP Spanish Language & Culture | LANGUAGE | #2 nationally | Sprint 21 |
| AP French Language & Culture | LANGUAGE | Top 10 | Sprint 22 |
| AP Chinese Language & Culture | LANGUAGE | Top 15 | Sprint 22 |
| AP Japanese Language & Culture | LANGUAGE | Top 20 | Sprint 23 |
| AP World History: Modern | TEXT | #3 nationally | Sprint 22 |
| AP Government & Politics (US) | TEXT | Top 10 | Sprint 22 |
| AP Macroeconomics | TEXT | Top 10 | Sprint 23 |
| AP Statistics | VISUAL | Top 10 | Sprint 23 |
| AP Chemistry | VISUAL | Top 10 | Sprint 23 |
| AP Physics 1 | VISUAL | Top 10 | Sprint 23 |
| AP Computer Science A | VISUAL | Top 15 | Sprint 23 |
| AP Human Geography | TEXT | Top 10 | Sprint 22 |
| AP European History | TEXT | Top 15 | Sprint 23 |

> 🚧 **Sprint Grooming Note:** Each new AP subject is a content story, not an engineering story — the renderers, FSRS engine, and AI grading pipeline are already live. What changes per subject: question bank, rubric templates, AI prompt system prompt, and unit heatmap config. Each subject addition should be a 2-day content authoring task, not a 2-week sprint.

---

#### 🔷 Epic 3.4 — SIP v2.0: Predictive Intelligence (Sprint 23–24 | Weeks 45–48)
`subject_types: ALL`

By Month 18, AceOS has 12+ months of student data. SIP v2.0 shifts from reactive (responding to what happened) to predictive (forecasting what will happen and intervening before it does).

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Predictive Score Model v2** | ML model trained on 12 months of AceOS data; predicts AP score with ±0.3 accuracy by Week 4 of prep | ALL | P0 |
| **Early Warning System** | Detects burnout, disengagement, or score regression 2 weeks before it becomes critical; triggers personalized intervention | ALL | P0 |
| **Optimal Study Schedule Generator** | Given student's class load, AP exam dates, and SIP data — generates the mathematically optimal study schedule across all subjects | ALL | P0 |
| **Cross-Subject Concept Transfer** | Detects when mastery in one subject accelerates learning in another (e.g., AP Stats proficiency → AP Psych research methods) | ALL | P1 |
| **Subject-Type Strength Report** | Detailed annual report: "You are in the 89th percentile for VISUAL subjects and 61st for TEXT subjects — here's what that means for college apps" | ALL | P1 |
| **College Readiness Index** | Composite score across GPA arc + AP score projections + study consistency; updated monthly | ALL | P2 |

---

### Phase 3 — Sprint Schedule

| Sprint | Weeks | Focus | Deliverable | Subject Types Active |
|---|---|---|---|---|
| Sprint 19 | 37–38 | StudySensei foundation — Socratic engine + TEXT tutor UI | Text-based Socratic tutoring live for AP Lang, APUSH, AP Psych | TEXT |
| Sprint 20 | 39–40 | StudySensei VISUAL mode — equation walkthrough + live scratch pad | VISUAL Socratic tutoring live for AP Calc AB, AP Bio | VISUAL |
| Sprint 21 | 41–42 | LANGUAGE mode infrastructure — audio renderer + STT + special char keyboard + AP Spanish diagnostic | AP Spanish diagnostic + audio cards live; speech input working | LANGUAGE |
| Sprint 22 | 43–44 | StudySensei LANGUAGE mode + AP Spanish spoken FRQ grader + AP French/Chinese diagnostic | Target-language dialogue tutor live; spoken FRQ grading live | LANGUAGE |
| Sprint 23 | 45–46 | AP content expansion (10 new subjects across TEXT + VISUAL + LANGUAGE) + SIP v2.0 predictive model | 20 total AP subjects live; predictive score model active | ALL |
| Sprint 24 | 47–48 | SIP Early Warning System + optimal schedule generator + Phase 3 QA + performance audit | Full SIP v2.0 live; 18-month milestone review | ALL |

## 🗓️ PHASE 4: Network (Months 19–24)
### Launch SmartPack + AceIt Dashboard — Own the Social Layer

**Strategic Logic:** By Month 19, AceOS has proven individual student outcomes. Phase 4 adds the social accountability layer — SmartPack turns studying into a team sport, and the AceIt Dashboard unifies all four modules into a single intelligent command center. Network effects begin: students invite friends, parents refer other parents, schools become inbound leads.

---

### Phase 4 OKRs

**Objective 1:** Turn AceOS users into an acquisition channel.
- KR1: 30% of new signups in Month 19–24 come from SmartPack squad invitations
- KR2: Average squad size reaches 4.2 students within 30 days of squad formation
- KR3: Squad-active users show 2.1x higher 30-day retention vs. solo users

**Objective 2:** Make the AceIt Dashboard the student's academic home screen.
- KR1: 80% of active users open AceIt Dashboard as their first session action by Month 22
- KR2: Dashboard-first users have 35% longer average session time
- KR3: NPS for Dashboard experience ≥ 65

**Objective 3:** Establish school/district pipeline.
- KR1: 5 school pilot agreements signed by Month 24
- KR2: First $10,000 MRR from school licenses by Month 24
- KR3: $400,000 total MRR by Month 24

---

### Phase 4 Epics & Feature Breakdown

#### 🔷 Epic 4.1 — SmartPack: Squad Study System (Sprint 25–28 | Weeks 49–56)
`subject_types: ALL`

SmartPack is the social accountability engine. Research shows students with study accountability partners are 65% more likely to complete study goals. SmartPack makes this native to AceOS.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Squad Creation** | Student creates a study squad (2–6 members); invites via link or username; squad tied to shared AP subjects | ALL | P0 |
| **Squad Leaderboard** | Weekly ranking by cards reviewed, FRQs submitted, study time logged — resets every Monday | ALL | P0 |
| **Collective Weak Spot Detector** | AI analyzes all squad members' performance data; surfaces "Your squad's #1 shared weakness is AP Calc Unit 5 — schedule a group session?" | ALL | P0 |
| **Squad Challenge Mode** | 10-question timed quiz all squad members take simultaneously; results revealed after everyone submits | ALL | P1 |
| **Study Session Sync** | Squad members can join a live co-study session with shared timer and optional voice channel (via WebRTC) | ALL | P1 |
| **Squad FRQ Review** | Squad members review each other's AI-graded FRQs and leave peer comments; builds peer accountability | ALL | P1 |
| **Squad Progress Feed** | Activity feed: "Alex just scored 4/5 on the AP Bio practice exam" — social proof nudges | ALL | P0 |
| **Squad Goal Setting** | Squad collectively sets a target AP score; AI tracks collective progress toward the goal | ALL | P1 |
| **Anonymous Performance Mode** | Student can hide their scores from squad feed while still participating; reduces performance anxiety | ALL | P2 |

> 🚧 **Sprint Grooming Note:** "Study Session Sync" with WebRTC is the highest-complexity story in this epic — scope it as P1 and only build if squad adoption data from P0 features justifies it. Do not block the squad leaderboard and challenge mode on WebRTC being ready.

---

#### 🔷 Epic 4.2 — AceIt Dashboard: Unified Command Center (Sprint 26–28 | Weeks 51–56)
`subject_types: ALL`

The AceIt Dashboard is the front door of AceOS — the first screen a student sees every session. It unifies signals from GradeGuard, ScoreBoost AP, StudySensei, and SmartPack into one intelligent daily briefing.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Daily Intelligence Brief** | "Good morning, Alex. Your AP Calc grade dropped 4 points. You have 3 FSRS cards due. AP exam in 22 days. Start here →" | ALL | P0 |
| **Unified Progress Ring** | Single visual: GPA health + AP score trajectory + study streak + squad rank — all in one glanceable ring chart | ALL | P0 |
| **Priority Action Queue** | AI-ranked list of the 3 most important actions for today across all modules; taps directly into respective module | ALL | P0 |
| **Cross-Module Notifications Center** | All alerts (grade drop, streak at risk, squad challenge, FRQ graded) in one feed; no more scattered notifications | ALL | P0 |
| **Exam Countdown + Readiness Score** | Days until each AP exam + AI readiness score (0–100) based on SIP data; color-coded urgency | ALL | P0 |
| **Subject-Type Performance Snapshot** | Quick view: TEXT subjects avg, VISUAL subjects avg, LANGUAGE subjects avg — student sees their profile at a glance | ALL | P1 |
| **Customizable Widget Layout** | Student can pin/unpin modules and reorder dashboard widgets; layout saved to profile | ALL | P2 |
| **Parent View Toggle** | Student can share a read-only dashboard link with parent; updates in real-time | ALL | P1 |

---

#### 🔷 Epic 4.3 — School & Teacher Dashboard (Sprint 27–29 | Weeks 53–58)
`subject_types: ALL`

Schools are the highest-LTV customer segment ($8/student/month × 400 students = $3,200/month per school). The teacher dashboard is the unlock — teachers need visibility into class-wide performance without AceOS becoming a surveillance tool.

| Feature | Description | Subject Type | Priority |
|---|---|---|---|
| **Teacher Account Type** | Teacher creates account; links to student roster via school code; sees class-wide (not individual) performance data by default | ALL | P0 |
| **Class Performance Heatmap** | Teacher sees which AP units the class is collectively struggling with — not individual student grades | ALL | P0 |
| **Assignment Integration** | Teacher can push a study recommendation to the whole class: "Review Unit 4 before Friday's test" — appears in each student's Daily Intelligence Brief | ALL | P1 |
| **Anonymous Class Analytics** | Aggregate data only: avg diagnostic score, % of students on track for a 4/5, most-missed concepts | ALL | P0 |
| **School Admin Dashboard** | School admin sees aggregate performance across all teachers/classes; license usage; renewal alerts | ALL | P1 |
| **LMS Integration** | Canvas, Schoology, Google Classroom grade sync via `ILMSProvider` (defined in Phase 2, implemented here) | ALL | P1 |
| **Rostering via Clever/ClassLink** | School SSO and roster sync via Clever or ClassLink; removes friction for district-wide rollout | ALL | P1 |

---

#### 🔷 Epic 4.4 — Monetization Expansion (Sprint 28–30 | Weeks 55–60)
`subject_types: ALL`

| Feature | Description | Priority |
|---|---|---|
| **Annual Plan Push** | In-app campaign: "Switch to annual, save 40%" — timed to post-AP season (May/June) when students are planning for next year | P0 |
| **Family Plan Upsell** | When a Pro subscriber's sibling signs up, trigger Family Plan upgrade flow | P0 |
| **School License Sales Flow** | Self-serve school license purchase + onboarding flow; no sales call required for schools <500 students | P0 |
| **Referral Program v2** | Student referral program: "Get 2 weeks free for every friend who activates Pro" — tracked via `IAnalyticsProvider` | P1 |
| **AP Sprint Pack (seasonal)** | Re-market AP Sprint Pack each January–April; 90-day one-time purchase for students starting late | P0 |
| **Revenue Dashboard (Internal)** | MRR, churn, LTV, cohort retention — internal PostHog dashboard for team | P0 |

---

### Phase 4 — Sprint Schedule

| Sprint | Weeks | Focus | Deliverable | Subject Types Active |
|---|---|---|---|---|
| Sprint 25 | 49–50 | SmartPack — squad creation + leaderboard + progress feed | Squad system live; students can form and compete in squads | ALL |
| Sprint 26 | 51–52 | SmartPack — collective weak spot detector + squad challenge mode + AceIt Dashboard shell | Squad AI analysis live; Dashboard skeleton with daily brief | ALL |
| Sprint 27 | 53–54 | AceIt Dashboard — unified progress ring + priority action queue + exam countdown | Full Dashboard live and default landing page for all users | ALL |
| Sprint 28 | 55–56 | Teacher dashboard — class heatmap + anonymous analytics + school license flow | Teacher accounts live; first school pilots onboarded | ALL |
| Sprint 29 | 57–58 | LMS integration + Clever/ClassLink rostering + monetization expansion | School SSO live; annual plan push campaign launched | ALL |
| Sprint 30 | 59–60 | Performance audit, load testing at scale, security review, Phase 4 retrospective | 24-month milestone: $400K MRR target review | ALL |

## 🗓️ PHASE 5: Scale (Months 25–36)
### National Expansion, Native Apps, and Enterprise

**Strategic Logic:** By Month 24, AceOS has product-market fit in California, $400K MRR, and 20+ AP subjects covered. Phase 5 is the national push: expand beyond California, launch native iOS/Android apps, pursue district-level contracts, and begin international expansion with LANGUAGE mode as the wedge.

---

### Phase 5 OKRs

**Objective 1:** Achieve national scale.
- KR1: Students active in 40+ US states by Month 30
- KR2: $1M MRR by Month 30
- KR3: $2M MRR by Month 36

**Objective 2:** Launch native mobile apps.
- KR1: iOS app live in App Store by Month 27
- KR2: Android app live in Play Store by Month 28
- KR3: 40% of active users on mobile app vs. web by Month 32

**Objective 3:** Win district-level contracts.
- KR1: 3 school district contracts signed (500+ students each) by Month 32
- KR2: $100K ARR from school/district licenses by Month 36

---

### Phase 5 Key Initiatives

| Initiative | Description | Timeline |
|---|---|---|
| **Native iOS App** | React Native (Expo) app — full feature parity with web; offline FSRS review; biometric auth | Month 25–27 |
| **Native Android App** | Same codebase as iOS via Expo | Month 26–28 |
| **National Marketing Push** | Paid acquisition (Meta, TikTok, Google) targeting high-school students and parents in top AP states (TX, FL, NY, IL, WA) | Month 25+ |
| **District Sales Team** | First 2 dedicated sales hires targeting district-level contracts; inbound from school pilot referrals | Month 25 |
| **International Expansion — LATAM** | Full Spanish UI (`es.json`), LATAM-focused AP Spanish content, regional pricing | Month 28–30 |
| **International Expansion — East Asia** | Simplified Chinese UI, AP Chinese/Japanese content expansion, regional pricing | Month 30–33 |
| **AP Subject Completion** | Cover all 38 College Board AP subjects across TEXT, VISUAL, and LANGUAGE | Month 30 |
| **AceOS API (B2B)** | Public API allowing schools and tutoring companies to embed AceOS modules | Month 32+ |
| **RTL Language Support** | Arabic/Hebrew UI support for potential AP Arabic addition | Month 33+ |
| **FERPA / COPPA Compliance Audit** | Full legal compliance audit for US school district contracts | Month 24–25 |
| **SOC 2 Type II Certification** | Required for district-level contracts >$50K | Month 26–28 |

---

## 🚀 Go-To-Market Strategy

### Phase 1 GTM: AP Season Organic + Influencer
- **Channel 1 — TikTok/YouTube Study Influencers:** Partner with 10–15 micro-influencers (50K–500K followers) in the "studyblr" and "study with me" niche. Gifted Pro access + affiliate commission per conversion.
- **Channel 2 — Reddit + Discord:** Organic presence in r/APStudents, r/Sat, AP subject Discord servers. Provide genuine value (FRQ feedback, study tips) before any promotion.
- **Channel 3 — AP Teacher Outreach:** DM 500 AP teachers on Twitter/LinkedIn in February–March (peak planning season). Offer free class accounts for their students.
- **Hook:** "The only AP prep tool with an AI that grades your FRQs like a College Board reader."
- **Launch timing:** February 1 — gives students 90 days before May AP exams.

### Phase 2 GTM: Parent Channel + Referral Engine
- **Channel 1 — Facebook Parent Groups:** California HS parent groups are massive (50K–200K members). One authentic parent success story post = hundreds of signups.
- **Channel 2 — Parent Email Referral:** Weekly progress email includes a referral CTA: "Know another parent whose kid is taking AP exams? They get 2 weeks free."
- **Channel 3 — Nextdoor + Local Communities:** Hyper-local targeting in affluent California school districts (Palo Alto, Irvine, San Diego, Beverly Hills).

### Phase 3–4 GTM: School Channel + PR
- **Channel 1 — School Counselor Outreach:** School counselors are the gatekeepers for edtech recommendations. Target 200 California counselors with a "Results Report" showing GPA and AP score improvements.
- **Channel 2 — PR:** "AI Study Tool Helps California Students Score More 5s on AP Exams" — pitch to EdWeek, TechCrunch Education, local TV news during AP season.
- **Channel 3 — College Board Partnership Exploration:** Explore data partnership or co-marketing with College Board once scale and outcome data are proven.

---

## 📊 Success Metrics & KPI Dashboard

| Metric | Month 6 Target | Month 12 Target | Month 18 Target | Month 24 Target |
|---|---|---|---|---|
| **MRR** | $20K | $100K | $250K | $400K |
| **Active Students** | 2,000 | 8,000 | 20,000 | 45,000 |
| **AP Subjects Covered** | 6 | 6 | 20 | 38 |
| **Subject Types Live** | TEXT + VISUAL | TEXT + VISUAL | ALL THREE | ALL THREE |
| **NPS** | ≥55 | ≥60 | ≥65 | ≥68 |
| **7-Day Retention** | 45% | 55% | 65% | 70% |
| **Avg Session Frequency** | 3x/week | 4x/week | 5x/week | 5x/week |
| **FRQs Graded (cumulative)** | 5,000 | 50,000 | 250,000 | 1,000,000 |
| **School Licenses** | 0 | 0 | 2 pilots | 5 contracts |
| **Annual Plan %** | 10% | 20% | 30% | 35% |

---

## ⚠️ Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **College Board C&D on content** | Medium | High | All questions are original, College Board-aligned — never copied. Legal review before launch. Pluggable content system allows rapid swap if needed. |
| **LLM grading accuracy below bar** | Medium | High | Human-in-the-loop audit of first 500 graded FRQs; accuracy threshold of 85% before public launch; `ILLMGradingProvider` allows swap to better model instantly. |
| **STT accuracy for LANGUAGE mode** | Medium | Medium | Default to Web Speech API; swap to OpenAI Whisper for higher accuracy via `ISpeechProvider`; offer text-input fallback for all speaking tasks. |
| **FSRS engine cold-start problem** | Low | Medium | Seed new users with conservative initial intervals; collect 50+ responses before FSRS personalizes aggressively; `IFSRSProvider` allows algorithm tuning without code changes. |
| **LLM cost at scale** | High | Medium | TEXT grading uses cheap models (GPT-4o mini); VISUAL grading uses expensive models (GPT-4o) — route by `subject_type`. Cost per student modeled at $0.08/day at scale. |
| **Competitor copies subject-type framework** | Medium | Medium | 12-month first-mover advantage + network effects from SIP data moat. Data is the moat, not the feature. |
| **Student data privacy / FERPA** | Low | High | No PII sold. FERPA compliance built in from Phase 1. SOC 2 audit in Month 26. School contracts include DPA. |
| **Burnout / scope creep** | High | High | Strict sprint scope. Stories not groomed = not in sprint. Phase gates enforced. |
| **AP exam format changes by College Board** | Low | Medium | Pluggable content model — question format is config-driven. Bluebook UI updates are isolated to `VisualRenderer.tsx` and `TextRenderer.tsx`. |
| **Low LANGUAGE mode adoption** | Medium | Low | Language Add-On is separately priced ($4.99/mo) — low downside. Feature-flagged per language. AP Spanish ships first; others gated on Spanish adoption data. |

---

## 🗺️ Master Timeline Summary

| Phase | Months | Theme | North Star Milestone |
|---|---|---|---|
| **Phase 1** | 1–6 | Beachhead | ScoreBoost AP live · 6 AP subjects · $20K MRR · TEXT + VISUAL |
| **Phase 2** | 7–12 | Expand | GradeGuard live · Daily habit formed · $100K MRR · SIP v1.0 |
| **Phase 3** | 13–18 | Deepen | StudySensei live · LANGUAGE mode · 20 AP subjects · $250K MRR |
| **Phase 4** | 19–24 | Network | SmartPack + AceIt Dashboard · Schools · $400K MRR |
| **Phase 5** | 25–36 | Scale | Native apps · National · 38 AP subjects · $2M MRR |

---

*AceOS™ — Version 4.0 | April 2026 | Confidential — Internal Use Only*
*"The system every student deserves."*
