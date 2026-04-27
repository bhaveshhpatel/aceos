# AceOS

> FERPA-compliant academic performance platform for AP students. Phase 1: ScoreBoost AP — AI-powered AP exam prep engine.

![CI](https://github.com/bhaveshhpatel/aceos/actions/workflows/preview.yml/badge.svg?branch=main)

## What We're Building

AceOS is a multi-product suite for high school AP students and their parents:

| Phase | Product | Focus |
|---|---|---|
| 1 | **ScoreBoost AP** | AP exam prep — diagnostic + MCQ + FRQ grader |
| 2 | GradeGuard | Grade tracking + GPA forecasting |
| 3 | StudySensei | Spaced repetition study engine (FSRS-5) |
| 4 | SmartPack | Full suite bundling + parent dashboard |

Currently in **Phase 1 — Sprint 1 Functional**.

## Sprint 1 Status

| Story | Title | Status |
|---|---|---|
| S1-F-01 | Email Sign-Up | ✅ Closed |
| S1-F-02 | Google OAuth | ✅ Complete |
| S1-F-07 | Session Persistence & Sign-Out | ✅ Complete |
| S1-F-08 | Privacy Policy & ToS Acceptance | ✅ Complete |
| S1-F-04 | Email Verification (Resend) | 🔄 Next |
| S1-F-09 | Parental Consent Email | 🔄 Next |
| S1-F-03 | Age Gate & Parental Consent Flow | ❌ Not started |
| S1-F-05 | AP Subject Selection | ❌ Not started |
| S1-F-06 | Student Dashboard Shell | ❌ Not started |
| S1-F-10 | Account Recovery | ❌ Not started |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (email + Google OAuth) + custom age-gate + FERPA consent flow
- **Styling**: Tailwind CSS + shadcn/ui
- **Email**: Resend (transactional)
- **Testing**: Vitest (unit) + Playwright (E2E) + Gherkin BDD scenarios
- **AI**: OpenAI GPT-4o + Groq Llama via `lib/ai/gateway.ts` (swappable via `model_map.json`)
- **STEM Validation**: Modal.com Python sandbox (sympy, numpy)
- **Deployment**: Vercel (Next.js) — pending Sprint 1 Functional completion

## Getting Started

> ⚠️ This project has no local dev environment. All changes are made via GitHub MCP + Supabase MCP connectors.

If you do want to run it locally:

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase and Resend keys
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest unit test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint check |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only — never expose to browser) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full app URL (e.g. `https://aceos.vercel.app`) |
| `RESEND_API_KEY` | ✅ Sprint 1 | Resend API key for transactional email (verification + parental consent) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog analytics key |
| `OPENAI_API_KEY` | Sprint 2 | OpenAI API key |
| `GROQ_API_KEY` | Sprint 2 | Groq API key |
| `MODAL_SANDBOX_URL` | Sprint 2 | Modal.com STEM sandbox endpoint |

## AI Context (for AI assistants)

Read `CLAUDE.md` first. Then read `.context/PROJECT_STATUS.md` for current sprint status.
Never write code without reading the relevant `.context/` standards file first.

---

*AceOS — April 2026 | Phase 1 Sprint 1 | CI: 163/163 tests green*
