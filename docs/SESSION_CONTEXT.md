# AceOS — Session Context

> Last updated: 2026-04-26 (Session 2)
> Update this file at the end of every session before taking a break.

---

## Project Overview

AceOS is an AP exam prep platform. MVP product: **score-boost-ap**.

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Next.js API routes (server-side only)
- **Database**: Supabase (PostgreSQL) — project `olybgkhggqnmrfcjjojy`, region `us-west-1`
- **Auth**: Supabase Auth + custom age-gate/parental consent flow
- **Email**: Resend (installed, API key in Vercel env, NOT yet wired up)
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e — planned)
- **CI/CD**: GitHub Actions → Vercel API (`deploy.yml`)
- **Deployment**: Vercel — https://aceos-ai.vercel.app
- **Repo**: https://github.com/bhaveshhpatel/aceos

---

## Sprint 1 Story Status

### Functional Stories (`docs/phase-1/epic-1/Sprint_1_Functional_Stories.md`)

| ID | Story | Status | Notes |
|---|---|---|---|
| S1-F-01 | Email Sign-Up | ✅ Done | Merged to main. Signup → `students` insert + `consent_log` insert + `generateLink()`. Redirects to `/verify-email`. |
| S1-F-02 | Google OAuth Sign-Up & Sign-In | 🔲 Not started | Needs Google Cloud OAuth app. Supabase provider not enabled yet. |
| S1-F-03 | Age Gate & Parental Consent Flow | 🔲 Next after email | Blocked on S1-F-09 (email delivery). age gate branching logic exists in signup route. |
| S1-F-04 | Email Verification | 🔲 Not started | `generateLink()` called but no email sent. Blocked on Resend wiring. |
| S1-F-05 | Student Onboarding: AP Subject Selection | 🔲 Not started | |
| S1-F-06 | Student Dashboard Shell | 🔲 Not started | |
| S1-F-07 | Session Persistence & Sign-Out | 🔲 Not started | Supabase session handling exists via middleware but sign-out not built. |
| S1-F-08 | Privacy Policy & ToS Acceptance | ✅ Partial | Checkbox exists on signup form. `consent_log` rows written. Legal pages (`/legal/*`) not built yet → return 404. |
| S1-F-09 | Parental Consent Email Delivery | 🔲 Not started | Requires Resend wiring (S1-F-02 equivalent). |
| S1-F-10 | Account Recovery (Forgot Password) | 🔲 Not started | `/forgot-password` returns 404. |

### Technical Stories (`docs/phase-1/epic-1/Sprint_1_Technical_Stories.md`)

| ID | Story | Status | Notes |
|---|---|---|---|
| T1.1 | Supabase Schema Bootstrap | ✅ Partial | `students` + `consent_log` tables exist and work. Schema diverges from spec (see Schema Drift section below). |
| T1.2 | Vercel Deployment Pipeline | ✅ Done | `deploy.yml` uses Vercel CLI API approach (not `amondnet/vercel-action` as specced — works better). `test.yml` and `preview.yml` also exist. |
| T1.3 | LiteLLM Gateway Configuration | 🔲 Not started | Sprint 2+. |
| T1.4 | Authentication System Implementation | ✅ Partial | Email signup done. Google OAuth not started. Parental consent email not wired. Consent token/callback not built. |
| T1.5 | Subject Selection Screen | 🔲 Not started | |
| T1.6 | Privacy Policy & ToS Pages | 🔲 Not started | Routes return 404. |
| T1.7 | Profile Auto-Creation Trigger | ⚠️ Diverged | Spec says `profiles` table + DB trigger. Actual: `students` table inserted manually via API route. Trigger does NOT exist. Decision needed: align to spec or keep current approach. |
| T1.8 | Error Boundary & Graceful Degradation | 🔲 Not started | Raw Supabase errors may surface. |

---

## ⚠️ Schema Drift — Needs Decision

The technical spec (`T1.1`, `T1.7`) defines a `profiles` table with a DB trigger for auto-creation.
Actual implementation uses a `students` table with manual insertion in the API route.

| Spec | Actual | Impact |
|---|---|---|
| Table: `profiles` | Table: `students` | All queries reference wrong table name if spec is followed |
| Column: `parental_consent_status` | Column: `account_status` | Values also differ (`pending` vs `pending_age_check`) |
| Column: `is_minor` (computed) | Not present | No DB-level minor flag |
| Table: `consent_audit_log` | Table: `consent_log` | Column names also differ |
| Auto-creation via DB trigger | Manual insert in API route | If trigger is added later, double-insert risk |

**Decision needed at start of next session:** Do we refactor to align with spec, or update the spec to match implementation?
Recommendation: update spec to match implementation — the manual insert approach is simpler and more testable.

---

## What Was Done This Session

### Infrastructure Fixes
- Fixed Vercel auto-deploy: Vercel GitHub App was not creating webhooks. Full uninstall/reinstall fixed it.
- Added `deploy.yml` — deploys to Vercel via CLI API on push to main (after tests pass).
- Added `app/not-found.tsx` — fixed Next.js build failure on `/_not-found` page collection.
- Fixed `NEXT_PUBLIC_APP_URL` in Vercel env — was missing `https://` prefix, causing `new URL()` to throw.
- Fixed `middleware.ts` — `/api/auth` was missing from `PUBLIC_PATHS`, causing signup POST → 405.

### S1-F-01 — Email Sign-Up (✅ Complete)
- Signup flow working end-to-end in production.
- Form: first name, last name, email, password, DOB, ToS checkbox.
- API route creates: Supabase Auth user → `students` row → 2 `consent_log` rows → `generateLink()` call.
- Redirects to `/verify-email` on success.
- **Verification email NOT sent** — `generateLink()` generates link only. Resend not wired. This is S1-F-04/S1-F-09.

### Test Debt Payoff
- PR #3 merged: `tests/unit/auth/middleware.test.ts` — 20 cases for `isPublicPath()` logic.
- Confirmed existing tests cover: age gate branching (`pending_age_check` vs `active`), `consent_log` insertion, rollback on failure, Zod schema validation.

---

## Open Questions / Decisions Needed

1. **Schema drift**: Align DB schema to spec (`profiles` + trigger) or update spec to match implementation (`students` + manual insert)? Recommendation: update spec.
2. **Resend sending domain**: Verified custom domain (e.g. `hello@aceos.app`) or `onboarding@resend.dev` for now? Needed before S1-F-04/S1-F-09.
3. **Google OAuth**: Needs Google Cloud project with OAuth 2.0 credentials. Redirect URI: `https://olybgkhggqnmrfcjjojy.supabase.co/auth/v1/callback`. Not blocking current work.

---

## Known Issues

| Issue | Status | Notes |
|---|---|---|
| Google OAuth: `unsupported provider` (400) | 🔲 Open | Google provider not enabled in Supabase. Not Sprint 1 priority. |
| Verification email not sent after signup | 🔲 Open | By design — Resend not wired. S1-F-04 fixes this. |
| `/forgot-password` returns 404 | 🔲 Open | Page not built yet. S1-F-10. |
| `/legal/*` returns 404 | 🔲 Open | Legal pages not built. T1.6. |
| No DB trigger for profile auto-creation | 🔲 Open | Manual insert in API route works but diverges from T1.7 spec. |
| Error boundaries not implemented | 🔲 Open | Raw errors may surface. T1.8. |

---

## Environment Variables

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Required for `auth.admin.*` calls. Never expose to browser. |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | `https://aceos-ai.vercel.app` (must include `https://`) |
| `RESEND_API_KEY` | ✅ Set | Key exists in Vercel. Resend not wired up in code yet. |
| `VERCEL_TOKEN` | ✅ Set | GitHub Actions secret |
| `VERCEL_ORG_ID` | ✅ Set | GitHub Actions secret |
| `VERCEL_PROJECT_ID` | ✅ Set | GitHub Actions secret |
| `OPENAI_API_KEY` | ✅ Set | Sprint 2+ |
| `GROQ_API_KEY` | ✅ Set | Sprint 2+ |

---

## CI/CD Workflows

| File | Trigger | What it does |
|---|---|---|
| `.github/workflows/test.yml` | push + PR to main | Runs Vitest with coverage |
| `.github/workflows/preview.yml` | PR to main | Preview build check |
| `.github/workflows/deploy.yml` | push to main | Runs tests → deploys to Vercel production via CLI API |

---

## Test Coverage Summary

| File | What it tests |
|---|---|
| `tests/unit/auth/schemas.test.ts` | Zod validation for signup/signin schemas |
| `tests/unit/auth/signup-api.test.ts` | POST /api/auth/signup — happy path, age gate branching, consent_log, rollback, duplicate email |
| `tests/unit/auth/signin-api.test.ts` | POST /api/auth/signin |
| `tests/unit/auth/utils.test.ts` | `getAgeFromDob()` — boundary cases, leap year, integer check |
| `tests/unit/auth/middleware.test.ts` | `isPublicPath()` — all public paths, sub-paths, protected routes, false positives |

---

## How to Resume in a New Session

1. **Read this file first**
2. Read `docs/phase-1/epic-1/Sprint_1_Functional_Stories.md` for story specs
3. Read `docs/phase-1/epic-1/Sprint_1_Technical_Stories.md` for technical specs
4. Address the schema drift decision (see ⚠️ section above)
5. **Next story: S1-F-04 / S1-F-09 — wire up Resend transactional email**
6. Branch: `feat/s1-f04-email-verification`
7. Write tests first — mock Resend SDK, test dispatch, template rendering, error handling
8. Ask Dhruv: verified Resend domain or `onboarding@resend.dev` for now?
