# AceOS™ — Technical Roadmap
### *"Subject-Aware, Pluggable, and Scalable by Design"*
**Version 4.1 | Engineering Architecture Edition | April 2026**

---

## 📌 Engineering Mandate

AceOS must support three fundamentally different learning modes — text-heavy, visual/STEM, and language/audio — without turning the codebase into a branch-filled mess.

The technical roadmap exists to enforce four things:
1. Every experience is subject-aware.
2. Every external service is replaceable.
3. Every launch is feature-flagged.
4. Every future localization need is designed in early.

---

## 🧭 Founding Engineering Principles

| Principle | What It Means in Practice |
|---|---|
| **1. Subject-Type Awareness** | Every feature declares support for `TEXT`, `VISUAL`, or `LANGUAGE`. |
| **2. Pluggable-First Architecture** | External vendors are hidden behind provider interfaces. |
| **3. i18n & Localization Ready** | Strings, content, and prompts are localization-ready from Sprint 1. |
| **4. Config-Driven Feature Flags** | Features, providers, and subject rollouts are controlled centrally. |

**Engineering rule:** If a story does not declare subject type, provider abstraction, localization status, and rollout gate, it is not ready.

---

## 🏗️ Platform Architecture

```text
┌─────────────────────────────────────────────────────┐
│                   AceIt Dashboard                   │
├──────────────┬──────────────┬──────────┬────────────┤
│  GradeGuard  │ ScoreBoost AP│StudySensei│ SmartPack  │
├──────────────┴──────────────┴──────────┴────────────┤
│   Subject-Type Rendering Layer (TEXT | VISUAL | LANGUAGE)   │
├─────────────────────────────────────────────────────┤
│          Student Intelligence Profile (SIP)         │
├─────────────────────────────────────────────────────┤
│         Pluggable Provider Abstraction Layer        │
├─────────────────────────────────────────────────────┤
│         i18n / Localization Layer                   │
├─────────────────────────────────────────────────────┤
│            Shared Data & Auth Layer                 │
└─────────────────────────────────────────────────────┘
```

### Architectural Roles

| Layer | Responsibility |
|---|---|
| **Module Layer** | Product-facing workflows for ScoreBoost AP, GradeGuard, StudySensei, and SmartPack |
| **Rendering Layer** | Chooses the correct UI/interaction model by subject type |
| **SIP Layer** | Stores and serves intelligence signals, predictions, and personalization |
| **Provider Layer** | Isolates third-party dependencies behind interfaces |
| **Localization Layer** | Handles locale-aware strings, content, and prompts |
| **Data/Auth Layer** | Core persistence, identity, and access control |

---

## 🎨 Subject-Type Framework

### Supported Modes

| Mode | Tag | Use Cases |
|---|---|---|
| **TEXT** | `TEXT` | Essays, reading comprehension, argumentation, rubric-based writing |
| **VISUAL / STEM** | `VISUAL` | Equations, diagrams, graphs, scratch-pad workflows |
| **LANGUAGE** | `LANGUAGE` | Audio playback, speech input, pronunciation, multilingual text |

### Renderer Responsibilities

| Concern | TEXT | VISUAL | LANGUAGE |
|---|---|---|---|
| Question rendering | Rich text / markdown | Formula + graph / diagram rendering | Audio + script display |
| Answer input | Editor / textarea | Equation builder / drawing pad | Speech + text + special keyboard |
| AI grading path | Text rubric grading | Multimodal grading | STT + language scoring |
| Feedback pattern | Inline commentary | Step correction + overlays | Pronunciation + grammar feedback |
| Spaced repetition asset | Text cards | Formula / diagram cards | Audio cards |

### Core Data Model

```typescript
type SubjectType = 'TEXT' | 'VISUAL' | 'LANGUAGE';

interface Question {
  id: string;
  subject_type: SubjectType;
  locale: string;
  content: QuestionContent;
  rubric: Rubric;
  ap_unit: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

interface VisualQuestionContent extends QuestionContent {
  latex?: string;
  diagram_url?: string;
  graph_config?: GraphConfig;
  requires_drawing: boolean;
}

interface LanguageQuestionContent extends QuestionContent {
  audio_url?: string;
  target_language: string;
  requires_speech_input: boolean;
  script_display?: 'latin' | 'hanzi_pinyin' | 'hiragana_kanji' | 'cyrillic';
}
```

**Engineering rule:** Renderer selection must be data-driven by `subject_type`, not scattered UI conditionals.

---

## 🧩 Provider Architecture

### Provider Map

| Domain | Interface | Phase 1 Default | Config Key |
|---|---|---|---|
| LLM — Grading | `ILLMGradingProvider` | Gemini Flash / GPT-4o mini | `LLM_GRADING_PROVIDER` |
| LLM — Tutor | `ILLMTutorProvider` | Groq + Llama 3.3 70B | `LLM_TUTOR_PROVIDER` |
| Embeddings | `IEmbeddingProvider` | text-embedding-3-small / Nomic | `EMBEDDING_PROVIDER` |
| Auth | `IAuthProvider` | Supabase Auth | `AUTH_PROVIDER` |
| Database | `IDBProvider` | Supabase Postgres | `DB_PROVIDER` |
| Storage | `IStorageProvider` | Cloudflare R2 | `STORAGE_PROVIDER` |
| Email | `IEmailProvider` | Resend | `EMAIL_PROVIDER` |
| Payments | `IPaymentProvider` | Stripe | `PAYMENT_PROVIDER` |
| Analytics | `IAnalyticsProvider` | PostHog | `ANALYTICS_PROVIDER` |
| Feature Flags | `IFeatureFlagProvider` | Config/env | `FEATURE_FLAG_PROVIDER` |
| FSRS | `IFSRSProvider` | `ts-fsrs` | `FSRS_PROVIDER` |
| Search | `ISearchProvider` | Postgres FTS + pgvector | `SEARCH_PROVIDER` |
| Math Rendering | `IMathRenderer` | MathJax 3 | `MATH_RENDERER` |
| Diagram Rendering | `IDiagramRenderer` | Excalidraw / Canvas | `DIAGRAM_RENDERER` |
| Speech | `ISpeechProvider` | Web Speech API | `SPEECH_PROVIDER` |
| Notifications | `INotificationProvider` | Email + browser push | `NOTIFICATION_PROVIDER` |

### Provider Pattern

```typescript
export interface ILLMGradingProvider {
  gradeResponse(params: GradingParams): Promise<GradingResult>;
  getModelInfo(): ProviderMeta;
}

export const gradingProvider: ILLMGradingProvider =
  process.env.LLM_GRADING_PROVIDER === 'openai'
    ? new OpenAIGradingProvider()
    : new GeminiGradingProvider();
```

**Engineering rule:** New vendor integration starts with the interface, not the SDK.

---

## 🌐 Localization Architecture

| Layer | Approach |
|---|---|
| **UI Strings** | `next-intl` with `/messages/{locale}.json` |
| **Content Locale** | `locale` field on content entities |
| **Prompt Localization** | Prompt templates parameterized by target language |
| **RTL Support** | Tailwind direction support reserved for future expansion |
| **Special Character Input** | Locale-aware keyboard provider |
| **Audio Asset Strategy** | Locale-structured media paths |

### Audio Path Convention

```text
/{locale}/{subject}/{unit}/{file_id}.mp3
```

**Engineering rule:** Store relative asset paths in data; do not hardcode CDN URLs into product logic.

---

## 🛠️ Phase 1 Technical Stack

### Frontend

| Layer | Technology | Interface | Swap-In |
|---|---|---|---|
| Framework | Next.js 15 | — | Remix / SvelteKit |
| Styling | Tailwind CSS + shadcn/ui | — | — |
| State | Zustand | — | Jotai / RTK |
| i18n | `next-intl` | `ILocaleProvider` | `react-i18next`, `lingui` |
| Math | MathJax 3 | `IMathRenderer` | KaTeX |
| Diagramming | Excalidraw + Canvas | `IDiagramRenderer` | Konva, Fabric, tldraw |
| Text Editor | Tiptap | `ITextEditorProvider` | Quill, Lexical |
| Audio Playback | HTML5 audio | `IAudioPlayer` | Howler.js |
| Speech Input | Web Speech API | `ISpeechProvider` | Whisper, Deepgram |
| Keyboard | `react-simple-keyboard` | `IKeyboardProvider` | Custom keyboard |
| Charts | Recharts | — | Chart.js, Nivo |
| Motion | Framer Motion | — | — |

### Backend

| Layer | Technology | Interface | Swap-In |
|---|---|---|---|
| API | Next.js API Routes + Server Actions | — | Separate service layer later |
| Database | Supabase Postgres | `IDBProvider` | Neon, PlanetScale |
| Auth | Supabase Auth | `IAuthProvider` | Clerk, Auth0 |
| ORM | Drizzle | — | Prisma |
| Storage | Cloudflare R2 | `IStorageProvider` | S3, GCS |
| FSRS | `ts-fsrs` | `IFSRSProvider` | Python service / custom variant |
| Vector Search | pgvector | `ISearchProvider` | Pinecone, Weaviate |
| Jobs | Edge Functions + pg_cron | `IJobQueueProvider` | Inngest, Trigger.dev |
| Realtime | Supabase Realtime | — | Ably, Pusher |

### AI / ML

| Layer | Technology | Interface | Swap-In |
|---|---|---|---|
| TEXT Grading | GPT-4o mini | `ILLMGradingProvider` | Claude Haiku, Gemini Flash |
| VISUAL Grading | GPT-4o | `ILLMGradingProvider` | Gemini 1.5 Pro, Claude Sonnet |
| Tutor | Groq + Llama 3.3 70B | `ILLMTutorProvider` | GPT-4o, Claude, Gemini |
| Language Grading | GPT-4o multilingual | `ILLMGradingProvider` | Claude, Gemini |
| Embeddings | `text-embedding-3-small` | `IEmbeddingProvider` | Cohere, Voyage, Nomic |
| Equation OCR | GPT-4o Vision | `IEquationOCRProvider` | Mathpix, Google Vision |
| Speech to Text | Web Speech API | `ISpeechProvider` | Whisper, Deepgram |

### Infrastructure

| Layer | Technology | Interface | Swap-In |
|---|---|---|---|
| Hosting | Vercel | — | Railway, Fly.io |
| CDN | Vercel Edge + R2 | — | CloudFront |
| Email | Resend | `IEmailProvider` | SendGrid, Postmark |
| Payments | Stripe | `IPaymentProvider` | LemonSqueezy, Paddle |
| Analytics | PostHog | `IAnalyticsProvider` | Mixpanel, Amplitude |
| Monitoring | Sentry | — | Datadog |
| Feature Flags | Env vars + config JSON | `IFeatureFlagProvider` | LaunchDarkly, GrowthBook |
| CI/CD | GitHub Actions | — | — |
| Secrets | Vercel env vars | — | Doppler, AWS Secrets Manager |

---

## 📁 Codebase Shape

```text
aceos/
├── app/
├── components/
│   ├── renderers/
│   │   ├── TextRenderer.tsx
│   │   ├── VisualRenderer.tsx
│   │   └── LanguageRenderer.tsx
│   ├── ui/
│   └── shared/
├── providers/
│   ├── llm/
│   ├── auth/
│   ├── storage/
│   ├── email/
│   ├── payment/
│   ├── speech/
│   ├── fsrs/
│   └── analytics/
├── config/
│   ├── providers.ts
│   ├── subjects.ts
│   └── feature-flags.ts
├── messages/
│   ├── en.json
│   ├── es.json
│   └── zh-Hans.json
├── lib/
│   ├── fsrs/
│   ├── ai/
│   ├── db/
│   └── sip/
└── public/
    └── audio/
```

### File-Level Rules
- No direct vendor SDK imports outside `providers/`
- New shared logic goes into `lib/`, not random feature folders
- New UI components must declare supported subject types
- Provider swaps should happen in config, not feature code

---

## 🗓️ Technical Execution by Phase

### Phase 1 — Foundations
- Provider abstraction scaffold
- Feature flag foundation
- Localization scaffold
- Subject-type renderer foundation
- Diagnostic engine foundation
- FSRS integration
- Multimodal grading for STEM
- Exam simulator shell
- Payment and auth plumbing
- UAT, performance testing, swap drills

### Phase 2 — Intelligence + Habit Loop
- GPA and grade schema expansion
- Cross-module signal bridge
- SIP service boundary
- Parent reporting pipeline
- PWA capabilities
- Notification pipeline
- Offline sync strategy

### Phase 3 — Tutoring + Language Stack
- Low-latency tutoring engine
- Session memory retrieval
- Speech input pipeline
- Pronunciation scoring
- Audio content pipeline
- Multilingual prompt architecture
- Language renderer maturity
- Predictive SIP models

### Phase 4 — Social + School Scale
- Squad data model
- Shared progress and leaderboard infrastructure
- Real-time collaboration primitives
- Teacher and school analytics model
- Admin controls
- Higher-scale notification and reporting systems

### Phase 5 — National Scale
- Native mobile platform architecture
- District-grade compliance hardening
- API platform design
- Regional localization maturity
- Enterprise reliability and audit posture

---

## 🚧 Engineering Rules for Sprint Grooming

| Rule | Why It Exists |
|---|---|
| Every story must declare subject type | Prevent ambiguous UX and schema design |
| Every external dependency starts with an interface | Keeps the codebase swappable |
| Every rollout is feature-flagged | Enables safe release and phased launches |
| Every string is localization-ready | Prevents retrofit pain later |
| Every SIP access goes through a service layer | Avoids raw-table coupling and logic sprawl |
| Every renderer is mode-specific | Prevents one bloated universal component |

---

## ⚠️ Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM grading quality variance | Medium | High | Human audit loop, model routing, provider swap readiness |
| High inference cost | High | Medium | Route cheap models for text; reserve multimodal for visual/language needs |
| Speech-to-text inaccuracy | Medium | Medium | Fallback flows, provider abstraction, phased rollout |
| Cold-start personalization | Low | Medium | Conservative defaults and progressive adaptation |
| Architecture drift | High | High | Enforce provider boundaries and grooming gates |
| Scope creep into premature native/enterprise work | High | High | Phase-gated execution and non-negotiable platform milestones |
| Data/privacy/compliance debt | Low | High | Early policy design, audit prep, strict access boundaries |

---

## ✅ Definition of Technical Readiness

A feature is technically ready only if:
1. Subject type is declared.
2. Provider dependencies are abstracted.
3. Feature flag path is defined.
4. Localization impact is documented.
5. Data model changes are specified.
6. SIP touchpoints are defined, if applicable.
7. Rollback path exists.

---

*AceOS™ — Engineering Architecture Edition | April 2026 | Confidential — Internal Use Only*
