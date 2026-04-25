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
| Bluebook simulator | Text essay interface | Split-screen equation scratch pad | N/A (Bluebook doesn’t cover language orals) |
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

*(Sections continue below — pushed incrementally)*
