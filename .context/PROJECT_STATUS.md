# AceOS — Project Status

> **How to use this file:**
> At the start of every new chat thread say: **"read the project status"**
> I will pull this file and immediately know exactly where we are.
> Update this file at the end of every working session.

---

## Last Updated
April 26, 2026 — Session with Perplexity AI (GitHub + Supabase MCP connectors)

---

## Project Overview
- **Product:** AceOS — AI-powered academic performance platform (multi-product suite)
- **Phase 1 product:** ScoreBoost AP (`score-boost-ap`) — AP exam prep engine
- **Full suite:** ScoreBoost AP → GradeGuard → StudySensei → SmartPack (4 products, 4 phases)
- **Stack:** Next.js 14, Supabase (PostgreSQL + Auth), TypeScript, Tailwind CSS
- **AI layer:** OpenAI (GPT-4o) + Groq (Llama) via custom gateway, Modal.com for STEM sandbox
- **Repo:** https://github.com/bhaveshhpatel/aceos
- **Supabase project:** https://supabase.com/dashboard/project/olybgkhggqnmrfcjjojy
- **Supabase URL:** https://olybgkhggqnmrfcjjojy.supabase.co
- **No local development setup** — all changes pushed directly via GitHub + Supabase MCP connectors

---

## Epic & Sprint Structure (Phase 1)

| Epic | Sprints | Focus |
|---|---|---|
| Epic 1 — Foundation & Legal | Sprint 1 + Sprint 2 | Auth, infra, AI pipeline |

> There is no Sprint 3 in Epic 1. After Epic 1 is done, move to Epic 2.

---

## Current Sprint Status

### 🔄 Sprint 1 Functional — IN PROGRESS

| Story | Title | Priority | Status |
|---|---|---|---|
| S1-F-01 | Email Sign-Up | P0 | ✅ Complete |
| S1-F-02 | Google OAuth Sign-Up & Sign-In | P0 | ✅ Complete |
| S1-F-03 | Age Gate & Parental Consent Flow | P0 | ❌ Not started ← NEXT |
| S1-F-04 | Email Verification | P0 | ✅ Complete (VerifyEmailScreen + callback route) |
| S1-F-05 | Student Onboarding: AP Subject Selection | P0 | ❌ Not started |
| S1-F-06 | Student Dashboard Shell | P0 | ❌ Not started |
| S1-F-07 | Session Persistence & Sign-Out | P0 | ✅ Complete (middleware + useAuth hook) |
| S1-F-08 | Privacy Policy & Terms of Service Acceptance | P0 | ✅ Complete (checkbox + consent_log) |
| S1-F-09 | Parental Consent Email Delivery | P0 | ❌ Not started |
| S1-F-10 | Account Recovery (Forgot Password) | P1 | ❌ Not started |

**Build order:** S1-F-03 → S1-F-05 → S1-F-06 → S1-F-09 → S1-F-10 → Vercel deploy

---

### ✅ Sprint 2 Technical — COMPLETE

| Story | Title | Status |
|---|---|---|
| TS2-01 | Modal STEM Sandbox | ✅ Files pushed, Modal deploy still needed |
| TS2-02 | AI Gateway | ✅ `lib/ai/gateway.ts`, `model_map.json` |
| TS2-03 | Prompt Template System | ✅ 7 prompt files + registry + renderer |
| TS2-04 | Error Handling | ✅ `AIError`, `handleAIError`, Zod schema |
| TS2-05 | QA Harness | ✅ `scripts/qa/harness.ts` + types |

**CI Status:** GitHub Actions passing — 59/59 tests green (as of commit `24de83b`)

---

### ❌ Sprint 2 Functional — NOT STARTED
Diagnostic flow, MCQ engine, FRQ grader UI. Starts after Sprint 1 Functional is complete.

---

## Everything Built This Session (April 26, 2026)

### Standards + Context
- `.context/FRONTEND_STANDARDS.md` — full principal engineer frontend standards
- `.context/DEPLOYMENT_STATUS.md` — Vercel + Railway + Modal deployment plan and checklists
- `.context/PROJECT_STATUS.md` — this file (kept current)

### Batch 1 — Foundation
- `package.json`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`
- `app/layout.tsx`, `app/page.tsx` (redirects to /signin)
- `app/(auth)/layout.tsx`, `signin/page.tsx`, `signup/page.tsx`, `verify-email/page.tsx`
- `app/auth/callback/route.ts` — OAuth + email verification (now product-scoped)
- `middleware.ts` — session refresh + route protection (now product-scoped paths)
- `lib/supabase/client.ts`, `lib/utils.ts`
- `components/ui/` — Button, Input, Divider, Alert
- `types/auth.ts` — Zod schemas + TypeScript types

### Batch 2 — S1-F-01 + S1-F-02
- `app/api/auth/signup/route.ts` — full signup with rollback, consent log, product-aware redirect
- `app/api/auth/signin/route.ts` — signin with account status checks
- `hooks/useAuth.ts`
- `components/features/auth/` — OAuthButton, SignUpForm, SignInForm, VerifyEmailScreen, AuthErrorBoundary

### Suite Alignment (post-Batch 2)
- **`config/`** — `analytics.config.ts`, `email.config.ts`, `payments.config.ts`, `flags.config.ts`
- **`lib/providers/`** — `analytics/`, `email/`, `payments/`, `flags/` — all vendor abstraction layers
- **`lib/sip/index.ts`** — `getSIP()` — Student Intelligence Profile fetch, product-scoped
- **`lib/sip/ace-rank.ts`** — `computeAceRank()` + `rankUnits()` — exact formula from PROJECT_CONTEXT
- **`components/features/`** — product-scoped subdirs: `score-boost-ap/`, `grade-guard/`, `study-sensei/`, `smart-pack/`
- **URL pivot** — `/onboarding/[product]/age-gate`, `/onboarding/[product]/subjects`, `/[product]/dashboard`
- **`app/(onboarding)/`** route group with `[product]` dynamic segment shells
- **`app/(dashboard)/`** route group with `[product]/dashboard` shell

### Supabase Migrations Applied (in order)
1. `sprint_1_auth_schema` — students, consent_log, subjects (6 AP subjects seeded), student_subjects, mastery_map, enums, RLS, indexes
2. `add_products_table_and_product_scoping` — products table (4 products seeded), product_id FK on subjects + student_subjects + mastery_map, backfill to score-boost-ap

---

## Infrastructure Status

### Supabase
- **Project:** `aceos` — `olybgkhggqnmrfcjjojy` — us-west-1 — ACTIVE_HEALTHY
- **Migrations applied:** `ai_usage_log`, `sprint_1_auth_schema`, `add_products_table_and_product_scoping`
- **`SUPABASE_SERVICE_ROLE_KEY`:** ❌ NOT yet set in Vercel env vars — required before first deploy

### Deployment
- **Vercel:** ❌ Not connected yet — see `.context/DEPLOYMENT_STATUS.md`
- **Railway:** Not needed until Sprint 2 Functional
- **Decision:** Deploy to Vercel after Sprint 1 Functional is fully complete

### Modal.com STEM Sandbox
- **Files:** ✅ pushed to `modal_sandbox/`
- **Deployed:** ❌ NOT deployed — not blocking Sprint 1

### GitHub Actions CI
- **Status:** ✅ 59/59 tests passing (may need update after structural changes)

---

## Repository Structure (current)

```
aceos/
├── .context/               ← AI context files (read first)
├── app/
│   ├── (auth)/             ← /signin /signup /verify-email
│   ├── (onboarding)/       ← /onboarding/[product]/age-gate + /subjects
│   ├── (dashboard)/        ← /[product]/dashboard
│   └── api/auth/           ← signup + signin route handlers
├── components/
│   ├── ui/                 ← Button, Input, Divider, Alert
│   └── features/
│       ├── auth/           ← product-agnostic auth components
│       ├── score-boost-ap/ ← Phase 1 feature components
│       ├── grade-guard/    ← Phase 2 (stub)
│       ├── study-sensei/   ← Phase 3 (stub)
│       └── smart-pack/     ← Phase 4 (stub)
├── config/                 ← analytics, email, payments, flags configs
├── lib/
│   ├── ai/                 ← gateway, prompts, errors
│   ├── supabase/           ← server + browser clients
│   ├── sip/                ← Student Intelligence Profile + ace-rank
│   └── providers/          ← analytics, email, payments, flags abstractions
├── hooks/                  ← useAuth
├── types/                  ← auth.ts
├── middleware.ts
├── modal_sandbox/
└── scripts/qa/
```

---

## Key Files Reference

| File | Purpose |
|---|---|
| `.context/PROJECT_STATUS.md` | This file — read at start of every session |
| `.context/PROJECT_CONTEXT.md` | Product vision, SIP schema, non-negotiables, repo structure |
| `.context/DEPLOYMENT_STATUS.md` | Vercel + Railway + Modal plan, env vars, checklist |
| `.context/FRONTEND_STANDARDS.md` | Principal engineer frontend standards |
| `config/flags.config.ts` | Feature flags for all 4 products |
| `lib/sip/index.ts` | Student Intelligence Profile — central data object |
| `lib/sip/ace-rank.ts` | ACE-Rank priority algorithm |
| `app/auth/callback/route.ts` | OAuth + email verification callback (product-scoped) |
| `middleware.ts` | Route protection + session refresh |
| `lib/supabase/server.ts` | Supabase SSR server client |
| `lib/ai/gateway.ts` | AI gateway — routes by model_map.json |

---

## All Decisions Made

- No local development — all changes via GitHub + Supabase MCP connectors
- AceOS is a multi-product suite — all code written product-scoped from Day 1
- URL structure is product-scoped: `/onboarding/[product]/...`, `/[product]/dashboard`
- `products` table is the source of truth for suite products — never hardcode product names in schema
- `lib/sip/` is the only place that reads the Student Intelligence Profile — never query mastery_map directly in components
- All external vendors abstracted via `lib/providers/` — never import PostHog/Resend/Stripe directly in app code
- No Facebook OAuth — add Apple Sign-In + Clever SSO in Phase 4
- Sprint 2 Technical built before Sprint 1 Functional intentionally (infra-first)
- Deploy to Vercel only after Sprint 1 Functional is fully complete (not mid-sprint)
- Railway not needed until Sprint 2 Functional
- Dark mode deferred to Phase 2
- `npm install` in CI instead of `npm ci` (no lock file committed)

---

## Immediate Next Steps

1. **S1-F-03** — Age Gate & Parental Consent (`/onboarding/score-boost-ap/age-gate`)
2. **S1-F-05** — AP Subject Selection (`/onboarding/score-boost-ap/subjects`)
3. **S1-F-06** — Student Dashboard Shell (`/score-boost-ap/dashboard`)
4. **S1-F-09** — Parental Consent Email (email provider abstraction + template)
5. **S1-F-10** — Forgot Password flow
6. **End of sprint** — Vercel deploy (see DEPLOYMENT_STATUS.md)

---

*Updated: April 26, 2026 | Suite alignment complete | S1-F-01/02/04/07/08 done | Next: S1-F-03*
