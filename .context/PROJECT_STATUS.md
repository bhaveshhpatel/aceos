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
- **Product:** AceOS — AI-powered AP exam prep platform
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
| S1-F-03 | Age Gate & Parental Consent Flow | P0 | ❌ Not started |
| S1-F-04 | Email Verification | P0 | ✅ Complete (VerifyEmailScreen + callback route) |
| S1-F-05 | Student Onboarding: AP Subject Selection | P0 | ❌ Not started |
| S1-F-06 | Student Dashboard Shell | P0 | ❌ Not started |
| S1-F-07 | Session Persistence & Sign-Out | P0 | ✅ Complete (middleware + useAuth hook) |
| S1-F-08 | Privacy Policy & Terms of Service Acceptance | P0 | ✅ Complete (checkbox + consent_log) |
| S1-F-09 | Parental Consent Email Delivery | P0 | ❌ Not started |
| S1-F-10 | Account Recovery (Forgot Password) | P1 | ❌ Not started |

**Next stories to build:** S1-F-03 (Age Gate) → S1-F-05 (Subject Selection) → S1-F-06 (Dashboard Shell) → S1-F-09 (Parental Consent Email) → S1-F-10 (Forgot Password)

---

### ✅ Sprint 2 Technical — COMPLETE (code pushed, tests green)

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

## What Was Built This Session (April 26, 2026)

### Standards
- `.context/FRONTEND_STANDARDS.md` — Full principal engineer frontend standards (design tokens, responsive breakpoints, component hierarchy, animation, a11y, performance, forms, code review checklist)

### Batch 1 — Foundation
- `package.json` — added Tailwind, RHF, framer-motion, lucide-react, tailwind-merge, clsx
- `tailwind.config.ts` — full design token system from FRONTEND_STANDARDS
- `postcss.config.js`
- `app/globals.css` — base styles, utility classes, focus rings
- `app/layout.tsx` — root layout with metadata + viewport
- `app/page.tsx` — redirects to /signin
- `app/(auth)/layout.tsx` — centered auth card layout
- `app/(auth)/signin/page.tsx`, `signup/page.tsx`, `verify-email/page.tsx` — page shells
- `app/auth/callback/route.ts` — OAuth + email verification callback handler
- `middleware.ts` — session refresh + route protection on every request
- `lib/supabase/client.ts` — browser Supabase client
- `lib/utils.ts` — `cn()` helper + `getAgeFromDob()`
- `components/ui/Button.tsx` — 5 variants, 4 sizes, loading state, 44px min tap target
- `components/ui/Input.tsx` — label, error, hint, aria wiring
- `components/ui/Divider.tsx`
- `components/ui/Alert.tsx` — error/success/info with role="alert"
- `types/auth.ts` — Zod schemas + TypeScript types for auth domain

### Batch 2 — S1-F-01 + S1-F-02 Feature Implementation
- `app/api/auth/signup/route.ts` — creates Auth user, inserts students row, logs consent, triggers verification
- `app/api/auth/signin/route.ts` — signs in, checks email verification + account status
- `hooks/useAuth.ts` — browser auth state listener
- `components/features/auth/OAuthButton.tsx` — Google OAuth with inline SVG, loading state
- `components/features/auth/SignUpForm.tsx` — full Zod-validated signup form (all ACs covered)
- `components/features/auth/SignInForm.tsx` — email + password sign-in with OAuth error surfacing
- `components/features/auth/VerifyEmailScreen.tsx` — resend flow, expired link handling
- `components/features/auth/AuthErrorBoundary.tsx` — error boundary for auth route group

### Supabase Migration Applied
- `sprint_1_auth_schema` migration — creates:
  - `students` table with RLS
  - `consent_log` table with RLS
  - `subjects` table seeded with 6 Phase 1 AP subjects
  - `student_subjects` table with RLS
  - `mastery_map` table with RLS + updated_at trigger
  - `account_status` enum + `consent_document_type` enum
  - All foreign keys and indexes

---

## Infrastructure Status

### Supabase
- **Project:** `aceos` — `olybgkhggqnmrfcjjojy` — us-west-1 — ACTIVE_HEALTHY
- **`ai_usage_log` table:** ✅ migrated
- **`sprint_1_auth_schema` migration:** ✅ applied (students, consent_log, subjects, student_subjects, mastery_map)
- **`SUPABASE_SERVICE_ROLE_KEY`:** ❌ NOT yet set in Vercel env vars — required before first deploy

### Deployment
- **Vercel:** ❌ Not connected yet — see `.context/DEPLOYMENT_STATUS.md`
- **Railway:** Not needed until Sprint 2 Functional (AI inference service)
- **Decision:** Deploy to Vercel after Sprint 1 Functional is fully complete (end-of-sprint deploy)

### Modal.com STEM Sandbox
- **Files:** ✅ pushed to `modal_sandbox/`
- **Deployed:** ❌ NOT deployed — manual CLI step required (not blocking Sprint 1)

### GitHub Actions CI
- **Status:** ✅ 59/59 tests passing
- **Secrets needed:** `SUPABASE_SERVICE_ROLE_KEY` — add before Vercel deploy

---

## Key Files Reference

| File | Purpose |
|---|---|
| `.context/PROJECT_STATUS.md` | This file — session state for new threads |
| `.context/DEPLOYMENT_STATUS.md` | Full deployment plan, checklist, env vars |
| `.context/FRONTEND_STANDARDS.md` | Principal engineer frontend standards |
| `DEPLOYMENT_CHECKLIST.md` | All secrets, when to set them, manual steps |
| `docs/phase-1/epic-1/Sprint_1_Functional_Stories.md` | Full acceptance criteria for Sprint 1 Functional |
| `app/auth/callback/route.ts` | OAuth + email verification callback handler |
| `middleware.ts` | Route protection + session refresh |
| `lib/supabase/server.ts` | Supabase SSR server client |
| `lib/supabase/client.ts` | Supabase browser client |
| `lib/ai/gateway.ts` | AI gateway — routes by model_map.json |
| `modal_sandbox/app.py` | Modal STEM validation sandbox entrypoint |

---

## Decisions Made

- No local development — all changes via GitHub + Supabase MCP connectors
- No Facebook OAuth — not relevant to 14–18 demographic; add Apple Sign-In + Clever in post-Phase 1
- Sprint 2 Technical built before Sprint 1 Functional intentionally (infra-first approach)
- Deploy to Vercel only after Sprint 1 Functional is fully complete (not mid-sprint)
- Railway not needed until Sprint 2 Functional (AI inference service)
- Dark mode deferred to Phase 2 — no `dark:` Tailwind variants in Phase 1
- `npm install` in CI instead of `npm ci` (no lock file committed)

---

## Immediate Next Steps (Continue This Session)

1. **S1-F-03** — Age Gate & Parental Consent Flow (`/onboarding/age-gate` page + consent token logic)
2. **S1-F-05** — AP Subject Selection (`/onboarding/subjects` page + `student_subjects` insert)
3. **S1-F-06** — Student Dashboard Shell (`/dashboard` page + subject cards)
4. **S1-F-09** — Parental Consent Email (Supabase Edge Function or API route + email template)
5. **S1-F-10** — Forgot Password flow
6. **End of sprint** — Deploy to Vercel (see DEPLOYMENT_STATUS.md for full checklist)

---

*Updated: April 26, 2026 | S1-F-01 + S1-F-02 + S1-F-04 + S1-F-07 + S1-F-08 complete | Next: S1-F-03*
