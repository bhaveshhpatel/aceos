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
- **Email**: Resend (installed, API key in Vercel env, not yet wired up)
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e — planned)
- **CI/CD**: GitHub Actions → Vercel API (deploy.yml)
- **Deployment**: Vercel — https://aceos-ai.vercel.app
- **Repo**: https://github.com/bhaveshhpatel/aceos

---

## Sprint 1 Story Status

| ID | Story | Status | Branch / Notes |
|---|---|---|---|
| S1-F-01 | Email Sign-Up | ✅ Done | Merged to main |
| S1-F-02 | Transactional Email (Resend) | 🔲 Next | Not started — need Resend domain confirmation |
| S1-F-03 | Age Gate & Parental Consent | 🔲 Blocked on S1-F-02 | |
| S1-F-04 | Email Verification + Auth Callback | 🔲 Blocked on S1-F-02 | |
| S1-F-05 | Sign In | 🔲 Not started | |
| S1-F-06 | Forgot / Reset Password | 🔲 Not started | |
| S1-F-07 | Google OAuth | 🔲 Not started — needs Google Cloud OAuth app | |
| S1-F-08 | Onboarding Flow | 🔲 Not started | |

---

## What Was Done This Session

### Infrastructure
- Fixed Vercel auto-deploy: Vercel GitHub App was not creating webhooks. Full uninstall/reinstall fixed it.
- Added `deploy.yml` GitHub Actions workflow — deploys to Vercel via API on every push to main (tests must pass first). Replaces broken webhook dependency.
- Added `not-found.tsx` to fix Next.js build error (`/_not-found` page collection failure).
- Fixed `NEXT_PUBLIC_APP_URL` in Vercel env — was missing `https://` prefix, causing `new URL()` to throw at build time.
- Fixed `middleware.ts` — `/api/auth` was missing from `PUBLIC_PATHS`, causing signup POST to be intercepted and redirected to `/signin` (405 error).

### S1-F-01 — Email Sign-Up
- Signup flow is fully working end-to-end in production.
- Form validates with Zod (6 fields: first name, last name, email, password, DOB, ToS checkbox).
- API route (`POST /api/auth/signup`) creates Supabase Auth user, inserts `students` row, inserts 2 `consent_log` rows, calls `generateLink()` (magiclink type).
- Redirects to `/verify-email` on success.
- **Note**: Verification email is NOT sent yet — `generateLink()` generates a link but Resend is not wired up. That is S1-F-02.

### Test Debt Payoff
- PR #3 merged: `tests/unit/auth/middleware.test.ts` — 20 test cases covering `isPublicPath()` logic.
- Confirmed existing tests cover: age gate branching, consent_log insertion, rollback on failure, schema validation.

---

## Open Questions / Decisions Needed

1. **Resend sending domain**: Are we using a verified custom domain (e.g. `hello@aceos.app`) or `onboarding@resend.dev` for now? This affects S1-F-02 implementation.
2. **Google OAuth**: Needs a Google Cloud project with OAuth 2.0 credentials. Redirect URI: `https://olybgkhggqnmrfcjjojy.supabase.co/auth/v1/callback`. Not blocking Sprint 1.

---

## Known Issues

| Issue | Status | Notes |
|---|---|---|
| Google OAuth returns 400 `unsupported provider` | 🔲 Open | Google provider not enabled in Supabase. Not Sprint 1 priority. |
| Verification email not sent after signup | 🔲 Open | By design — Resend not wired up yet. S1-F-02 fixes this. |
| `/forgot-password` page returns 404 | 🔲 Open | Page not built yet. S1-F-06. |
| `/legal/*` pages return 404 | 🔲 Open | Legal pages not built yet. |

---

## Environment Variables (Vercel — Production)

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Required for `auth.admin.*` calls |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | `https://aceos-ai.vercel.app` |
| `RESEND_API_KEY` | ✅ Set | Key exists but Resend not wired up yet |
| `VERCEL_TOKEN` | ✅ Set | GitHub Actions secret for deploy.yml |
| `VERCEL_ORG_ID` | ✅ Set | GitHub Actions secret for deploy.yml |
| `VERCEL_PROJECT_ID` | ✅ Set | GitHub Actions secret for deploy.yml |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❓ Unknown | In README, not confirmed in Vercel |

---

## CI/CD Workflows

| File | Trigger | What it does |
|---|---|---|
| `.github/workflows/test.yml` | push + PR to main | Runs Vitest with coverage |
| `.github/workflows/preview.yml` | PR to main | Runs Vitest for PR gating |
| `.github/workflows/deploy.yml` | push to main | Runs tests → deploys to Vercel production via API |

---

## How to Resume in a New Session

1. Read this file first
2. Read `docs/phase-1/epic-1/Sprint_1_Functional_Stories.md` for story specs
3. Next story: **S1-F-02 — Transactional Email**
4. Start on a fresh branch: `feat/s1-f02-email`
5. Write tests first (Resend mock, email dispatch, template rendering, error handling)
6. Ask Dhruv: verified Resend domain or `onboarding@resend.dev` for now?
7. Implement, get tests green, PR, merge
