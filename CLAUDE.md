# CLAUDE.md — AceOS AI Context Master File
## Read This First. Every Time.

This file is the single entry point for any AI assistant working on the AceOS codebase. Before writing a single line of code, read this file completely. Then read the specific standards files referenced below for your task area.

---

## What We Are Building

AceOS is a production-grade, FERPA-compliant academic performance platform for high school AP students and their parents. It has four modules (ScoreBoost AP, GradeGuard, StudySensei, SmartPack) that share a single Student Intelligence Profile (SIP). We are currently in **Phase 1: ScoreBoost AP**.

**Primary users:** Stressed AP students (Gr. 9–12) who check their grades obsessively and study in 15–30 minute bursts at night. **Secondary users:** Parents who pay for the product.

**Full product context:** `docs/AceOS_Claude_roadmap v1.0.md`

---

## The Non-Negotiables (Read Before Touching Any Code)

1. **FERPA compliance is not optional.** Student grade data, mastery scores, and SIP data are education records. They are encrypted at rest, never sent to AI providers with PII attached, and require parental consent for students under 18 before any record is written.

2. **Every AI provider is swappable via config, not code.** All AI calls go through `lib/ai/gateway.ts`. All model selection lives in `model_map.json`. No AI SDK is ever imported directly in application code.

3. **LLMs never validate their own STEM answers.** AP Calculus, AP Chemistry, AP Physics, AP Statistics, AP Biology (numerical), AP CS A answers are validated by Modal.com Python sandbox execution. Never by asking the LLM if it's correct.

4. **Prompts are code, not strings.** All prompt templates live in `lib/ai/prompts/`. They are versioned, tested, and loaded via `renderPrompt()`. No inline prompt strings in routes, components, or utilities.

5. **Test-Forward is not optional.** The order is: Gherkin `.feature` file → unit tests (RED) → implementation (GREEN) → integration tests → E2E tests → story Done. No step is skipped.

6. **RLS on every Supabase table.** Every table has Row Level Security enabled with explicit policies. No table ships without RLS.

7. **No secrets in code.** Ever. All secrets in environment variables. All env vars documented in `.env.example`.

---

## Test-Forward Workflow (The Exact Sequence)

For every story — functional or technical — follow this exact sequence:

```
1. Read story acceptance criteria
2. Write .feature file in tests/gherkin/{sprint}/{functional|technical}/
3. Add automation mapping comment to feature file header
4. Write unit tests → run → confirm RED (no implementation exists)
5. Implement feature → unit tests go GREEN
6. Write integration tests → GREEN
7. Write E2E test (if Functional story) → GREEN
8. Open PR → CI must pass
9. Verify story DoD checklist → mark Done
```

**The non-negotiable step:** Tests must be RED before implementation. A test that was never RED proves nothing.

Gherkin file location: `tests/gherkin/sprint-{N}/{functional|technical}/{STORY-ID}_{title}.feature`

Full Gherkin rules, automation mapping, and scenario writing standards: `.context/TESTING_STANDARDS.md` Section 3.

---

## Standards Files Index

For any task, read the relevant standards file FIRST. These files are the authoritative rules for this codebase.

| File | Read When |
|---|---|
| `.context/ARCHITECTURE_STANDARDS.md` | Designing any new feature, module, or service |
| `.context/CODING_STANDARDS.md` | Writing any TypeScript or Python code |
| `.context/TESTING_STANDARDS.md` | Writing tests, Gherkin scenarios, or QA processes |
| `.context/DATABASE_STANDARDS.md` | Creating tables, writing migrations, or designing schemas |
| `.context/API_STANDARDS.md` | Building any API route or client-side data fetching |
| `.context/AI_PIPELINE_STANDARDS.md` | Working on any AI feature, prompt, or gateway logic |
| `.context/SECURITY_STANDARDS.md` | Touching auth, user data, or any sensitive operation |
| `.context/PERFORMANCE_STANDARDS.md` | Optimizing queries, frontend rendering, or AI calls |
| `.context/OBSERVABILITY_STANDARDS.md` | Adding logging, metrics, or error tracking |
| `.context/PLUGABILITY_STANDARDS.md` | Adding any swappable component, provider, or integration |
| `.context/CICD_STANDARDS.md` | Working on GitHub Actions, deployments, or migrations |

---

## Tech Stack

```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:      Next.js API Routes (server-side only for secrets)
Database:     Supabase (PostgreSQL) + Row Level Security
Auth:         Supabase Auth (email + Google OAuth)
AI Gateway:   lib/ai/gateway.ts → model_map.json (PID model)
AI Models:    GPT-4o (grading), GPT-4o-mini (MCQ), Groq/Llama-3.3-70b (fast inference)
STEM Valid:   Modal.com Python sandbox (sympy, numpy, scipy, chempy)
Sched. Rep.:  FSRS-5 algorithm (self-hosted, open source)
Deployment:   Vercel (frontend), Render/Modal (backend services)
CI/CD:        GitHub Actions
Testing:      Vitest (unit), Playwright (E2E), Gherkin (BDD scenarios)
Monitoring:   Supabase metric tables + structured logs
```

---

## Directory Structure

```
aceos/
├── .context/                  # AI context files — read before coding
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             # Full CI pipeline
│   │   └── migrate.yml        # DB migration runner
│   └── PULL_REQUEST_TEMPLATE.md
├── app/                       # Next.js App Router
│   ├── (auth)/                # Auth routes (login, signup, consent)
│   ├── (dashboard)/           # Protected app routes
│   └── api/                   # API routes (server-side only)
├── components/                # React components
│   ├── ui/                    # shadcn/ui primitives
│   ├── ai/                    # AI-specific UI (error states, streaming)
│   ├── diagnostic/            # Diagnostic flow components
│   ├── frq/                   # FRQ grader components
│   └── study/                 # Study plan + daily queue components
├── lib/
│   ├── ai/
│   │   ├── gateway.ts         # ⭐ ALL AI calls go through here
│   │   ├── errors.ts          # AIError class + USER_FACING_ERRORS map
│   │   ├── handleAIError.ts   # Error boundary for all AI route handlers
│   │   ├── prompts/           # ⭐ ALL prompts live here — nowhere else
│   │   └── schemas/           # Zod schemas for all AI responses
│   ├── supabase/              # Supabase client (server + client)
│   ├── monitoring/            # Logger + performance tracking
│   ├── fsrs/                  # FSRS-5 spaced repetition algorithm
│   └── validators/            # Zod schemas for API inputs
├── modal_sandbox/             # Modal.com Python sandbox code
│   ├── app.py                 # Modal app entrypoint
│   └── handlers/              # Subject-specific validators
├── supabase/
│   ├── migrations/            # All DB migrations (forward-only)
│   └── seed/                  # Seed data for test environments
├── scripts/
│   └── qa/                    # QA harness + fixtures
├── tests/
│   ├── unit/                  # Vitest unit tests
│   ├── integration/           # API integration tests
│   ├── e2e/                   # Playwright E2E tests
│   ├── gherkin/               # ⭐ .feature files — written BEFORE implementation
│   │   ├── sprint-1/
│   │   │   ├── functional/    # S1-F-XX feature files
│   │   │   └── technical/     # T1-X feature files
│   │   └── sprint-2/
│   │       ├── functional/    # S2-F-XX feature files
│   │       └── technical/     # TS2-XX feature files
│   ├── mocks/                 # Shared test mocks (ai-gateway, modal-sandbox)
│   └── factories/             # Test data factories
├── docs/                      # Product + technical documentation
├── model_map.json             # ⭐ AI model routing config — never hardcode models
├── .env.example               # All required env vars (empty values)
├── CLAUDE.md                  # This file — AI entry point
└── package.json
```

---

## Current Phase: Phase 1 — Epic 1 (Sprints 1–2)

### What is built / in progress:
- Sprint 1: Auth, Supabase schema (SIP v0), onboarding flow, legal/FERPA groundwork
- Sprint 2: Modal sandbox, LiteLLM gateway, prompt template system, error handling, QA pipeline

### Sprint stories (source of truth for acceptance criteria):
- `docs/phase-1/epic-1/Sprint_1_Functional_Stories.md`
- `docs/phase-1/epic-1/Sprint_1_Technical_Stories.md`
- `docs/phase-1/epic-1/Sprint_2_Functional_Stories.md`
- `docs/phase-1/epic-1/Sprint_2_Technical_Stories.md`

### Gherkin feature files (source of truth for test automation):
- `tests/gherkin/sprint-1/functional/` — all S1-F-XX stories
- `tests/gherkin/sprint-1/technical/` — all T1-X stories
- `tests/gherkin/sprint-2/functional/` — all S2-F-XX stories
- `tests/gherkin/sprint-2/technical/` — all TS2-XX stories

---

## How to Use This Repo as an AI

### When asked to implement a feature:
1. Read the relevant sprint story for acceptance criteria
2. Read the relevant standards files for the feature type
3. **Write the `.feature` file first** (in `tests/gherkin/`)
4. Write unit tests against the Gherkin scenarios → confirm RED
5. Implement the feature → tests go GREEN
6. Write integration + E2E tests
7. Verify against the story's Definition of Done checklist

### When asked to review code:
1. Check against all applicable standards files
2. Flag any violation of a Non-Negotiable
3. Verify `.feature` file exists for the story being implemented
4. Check test coverage for the changed paths
5. Verify no secrets, no inline prompts, no direct AI SDK imports

### When asked to design a new feature:
1. Start from `ARCHITECTURE_STANDARDS.md` — does it fit the PID model?
2. Check `PLUGABILITY_STANDARDS.md` — are all external dependencies swappable?
3. Write the functional story first (PM hat), then the technical story (lead engineer hat)
4. Write Gherkin scenarios — if you can't write clean scenarios, the story isn't ready
5. Get Gherkin scenarios reviewed before implementation begins

### When in doubt about any standard:
The standards files are authoritative. This CLAUDE.md is the map. The standards files are the law.

---

## Quick Reference: Patterns That Are Always Wrong

```typescript
// ❌ Direct AI SDK import
import OpenAI from 'openai';

// ❌ Hardcoded model name anywhere outside model_map.json
{ model: 'gpt-4o' }

// ❌ Inline prompt string
const prompt = `You are an expert grader...`;

// ❌ getSession() for auth checks (use getUser())
const { session } = await supabase.auth.getSession();

// ❌ select * from Supabase (always select specific columns)
.select('*')

// ❌ Unvalidated AI response
JSON.parse(aiResponse.content)  // without Zod schema validation

// ❌ Raw error to client
return NextResponse.json({ error: err.message })  // exposes internals

// ❌ LLM validating STEM answer
callAI({ route: 'frq_grading', messages: [{ content: `Is ${answer} correct?` }] })

// ❌ Implementation before .feature file
// Writing code before the Gherkin scenario is written and reviewed
```

---

*AceOS — CLAUDE.md Master Context File | April 2026*
*Keep this file current. Every new standard, phase, or architectural decision updates this file.*
