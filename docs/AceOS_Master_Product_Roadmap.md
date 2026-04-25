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

*(Sections continue below — pushed incrementally)*
