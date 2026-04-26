# AceOS — Project Context for AI Assistants

> **This file is the first file any AI assistant must read before writing a single line of code.**
> It defines what we are building, for whom, and the non-negotiable architectural rules that govern every decision.

---

## What We Are Building

AceOS is a production-grade, AI-powered academic performance platform for high school students (Grades 9–12) and their parents. It is not a prototype. It is not an MVP with cleanup planned later. Every line of code written from Sprint 1 must meet production standards.

**Four modules, launched sequentially:**
- **ScoreBoost AP** — AP exam preparation engine (Phase 1, launching now)
- **GradeGuard** — Live GPA tracking and risk alerting (Phase 2)
- **StudySensei** — AI tutoring (Phase 3)
- **SmartPack** — Social accountability layer (Phase 4)

All four modules share a single **Student Intelligence Profile (SIP)** — the central data object that every module reads from and writes to.

---

## Primary Users

| User | Motivation | Key Behavior |
|---|---|---|
| AP Student (Gr. 11–12) | Score outcomes, peer comparison | Studies 15–30 min bursts, usually 9–11pm |
| Grade-Anxious Parent | GPA trajectory visibility | Monitors outcomes, primary payer |

**We are NOT building for:** teachers, districts, or middle school students in Phase 1.

---

## Non-Negotiable Founding Constraints

1. **FERPA compliance is Day 1, not Phase 4.** Data architecture enforces it from Sprint 1.
2. **No LMS token harvesting.** Browser extension reads rendered DOM only.
3. **Students will not change behavior for us.** Product fits existing habits.
4. **College Board content is copyrighted.** All questions are original, SME-written. Zero released exam material used as template.
5. **Revenue targets are directional.** Do not present as forecasts.

---

## Technology Stack (Phase 1)

| Layer | Technology | Swap Trigger |
|---|---|---|
| Frontend | Next.js 15 (App Router) on Vercel | Never — framework is foundational |
| Backend API | Next.js Route Handlers | Move to Modal.com serverless at scale |
| Database | Supabase (PostgreSQL) | Upgrade to Pro tier at row/connection limits |
| Auth | Supabase Auth (email + Google OAuth) | Add Clever SSO in Phase 4 |
| AI Gateway | LiteLLM via `model_map.json` | Never re-architect — update config only |
| Primary AI | GPT-4o | Swap via `model_map.json` |
| Fast AI | Groq (Llama 3.3-70b) | Swap via `model_map.json` |
| STEM Validation | Modal.com Python Sandbox | Do not replace |
| Spaced Repetition | FSRS-5 (self-hosted) | Do not replace |
| Styling | Tailwind CSS + shadcn/ui | Do not replace |
| Testing | Vitest + Playwright + Cucumber | Do not replace |
| Error Tracking | Sentry | Swap via config |
| Analytics | PostHog | Swap via config |

---

## The Plugability Rule

**Every external vendor or service must be swappable via configuration, not code.**

This means:
- AI models → `model_map.json`
- Analytics providers → `analytics.config.ts`
- Email providers → `email.config.ts`
- Payment providers → `payments.config.ts`
- Feature flags → `flags.config.ts`

If you find yourself writing `if (provider === 'openai')` anywhere in application code, you are violating this rule. The provider abstraction layer handles routing. Application code calls the abstraction, never the vendor directly.

---

## The SIP Schema (Central Data Object)

```json
{
  "student_id": "uuid",
  "ap_subjects": ["AP Chemistry", "AP US History"],
  "mastery_map": {
    "AP Chemistry": {
      "Unit 1 - Atomic Structure": {
        "mastery": 0.82,
        "last_reviewed": "2026-04-20",
        "fsrs_due": "2026-04-27"
      }
    }
  },
  "predicted_ap_scores": { "AP Chemistry": 3.2 },
  "gpa": { "current": 3.6, "projected_semester_end": 3.71, "target": 3.8 },
  "ace_rank": { "AP Chemistry Unit 2": 0.91 },
  "study_patterns": {
    "avg_session_length_minutes": 18,
    "peak_study_hour": 21,
    "sessions_per_week": 4
  }
}
```

## ACE-Rank Formula

```
ACE-Rank = (AP Exam Weight OR Grade Weight) × (Days Until Exam/Due Date)⁻¹ × (1 - Mastery Score)
```

Higher score = higher priority. Never expose the formula to students — surface only the ranked task list.

---

## Repository Structure

```
aceos/
├── .context/               ← AI context files (THIS folder — read first)
├── .github/
│   ├── workflows/          ← CI/CD pipelines
│   └── PULL_REQUEST_TEMPLATE.md
├── app/                    ← Next.js App Router pages and API routes
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   └── layout.tsx
├── components/             ← Shared UI components
│   ├── ui/                 ← shadcn/ui base components (never modify directly)
│   └── [feature]/          ← Feature-specific components
├── lib/                    ← All business logic, never import from app/
│   ├── ai/                 ← AI gateway, prompts, schemas, errors
│   ├── db/                 ← Supabase client, typed query helpers
│   ├── sip/                ← Student Intelligence Profile logic
│   ├── fsrs/               ← Spaced repetition algorithm
│   ├── ace-rank/           ← Priority ranking algorithm
│   └── providers/          ← All plugable provider abstractions
│       ├── analytics/
│       ├── email/
│       ├── payments/
│       └── flags/
├── config/                 ← All swappable provider configs
│   ├── model_map.json
│   ├── analytics.config.ts
│   ├── email.config.ts
│   ├── payments.config.ts
│   └── flags.config.ts
├── types/                  ← Global TypeScript types
├── hooks/                  ← React hooks
├── middleware.ts            ← Auth, rate limiting, security headers
├── modal_sandbox/          ← Modal.com Python sandbox
├── migrations/             ← Supabase SQL migrations
├── scripts/
│   └── qa/                 ← QA harness and fixtures
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── features/           ← Gherkin .feature files
└── docs/
    ├── phase-1/
    │   └── epic-1/
    └── standards/          ← This folder — all standards documents
```

---

## Reading Order for AI Assistants

1. `PROJECT_CONTEXT.md` ← you are here
2. `ARCHITECTURE_STANDARDS.md`
3. `CODING_STANDARDS.md`
4. `TESTING_STANDARDS.md`
5. `SECURITY_STANDARDS.md`
6. `PLUGABILITY_STANDARDS.md`
7. `DATABASE_STANDARDS.md`
8. `AI_PIPELINE_STANDARDS.md`

Then read the relevant sprint story files under `docs/phase-1/` before writing any code.

---

*Last updated: April 2026 | AceOS Internal — Not for External Distribution*
