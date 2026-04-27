# AceOS — Session Context

> Last updated: 2026-04-26 (Session 3)
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
| S1-F-01 | Email Sign-Up | ⚠️ Needs Validation | Merged to main. Signup → `students` insert + `consent_log` insert + `generateLink()`. Redirects to `/verify-email`. **Must validate against T1.1 + T1.4 before moving to S1-F-04.** |
| S1-F-02 | Google OAuth Sign-Up & Sign-In | 🔲 Not started | Needs Google Cloud OAuth app. Supabase provider not enabled. T1.4b not yet written. |
| S1-F-03 | Age Gate & Parental Consent Flow | 🔲 Not started | Covered by T1.4. Blocked on Resend wiring (S1-F-09). |
| S1-F-04 | Email Verification | 🔲 Not started | Covered by T1.4. `generateLink()` called but no email sent. Blocked on Resend wiring. **Next story after S1-F-01 validation.** |
| S1-F-05 | Student Onboarding: AP Subject Selection | 🔲 Not started | Covered by T1.5. |
| S1-F-06 | Student Dashboard Shell | 🔲 Not started | Covered by T1.10 (new). |
| S1-F-07 | Session Persistence & Sign-Out | 🔲 Not started | Covered by T1.9 (new). |
| S1-F-08 | Privacy Policy & ToS Acceptance | ⚠️ Partial | Checkbox + consent_log rows written (T1.4 done). Legal pages (`/legal/*`) return 404 (T1.6 not started). |
| S1-F-09 | Parental Consent Email Delivery | 🔲 Not started | Covered by T1.4. Requires Resend wiring. |
| S1-F-10 | Account Recovery (Forgot Password) | 🔲 Not started | Covered by T1.11 (new). `/forgot-password` returns 404. |

### Technical Stories (`docs/phase-1/epic-1/Sprint_1_Technical_Stories.md`)

| ID | Story | Status | Notes |
|---|---|---|---|
| T1.1 | Supabase Schema Bootstrap | ⚠️ Updated | Schema updated to reflect `students` + `consent_log` reality. `student_subjects` table not yet created. RLS policies need verification. |
| T1.2 | Vercel Deployment Pipeline | ✅ Done | Working. Uses Vercel CLI API. |
| T1.3 | LiteLLM Gateway Configuration | 🔲 Not started | Sprint 2+. |
| T1.4 | Authentication System Implementation | ✅ Updated | State machine corrected. Consent token expiry fixed to 7 days. Email verification + forgot password scenarios added. Covers S1-F-01, 03, 04, 09, 10. |
| T1.5 | Subject Selection Screen | 🔲 Not started | |
| T1.6 | Privacy Policy & ToS Pages | 🔲 Not started | Routes return 404. |
| T1.7 | Profile Auto-Creation Trigger | ⛔ Superseded | Decision made: manual insert in API route. Trigger will NOT be implemented. See T1.7 in doc for full rationale. |
| T1.8 | Error Boundary & Graceful Degradation | 🔲 Not started | |
| T1.9 | Session Management & Sign-Out | ✅ Written (new) | Covers S1-F-07. Full middleware spec, sign-out API route, expired session redirect. |
| T1.10 | Student Dashboard Shell | ✅ Written (new) | Covers S1-F-06. Server component architecture, NavBar spec, subject card spec, empty state. |
| T1.11 | Account Recovery (Forgot Password) | ✅ Written (new) | Covers S1-F-10. Full page/route map, Zod schema, Supabase native reset flow. |

---

## ✅ Schema Drift — RESOLVED

Decision made Session 3: **spec updated to match implementation.** The `students` table + manual insert approach is the canonical implementation. `profiles` table and DB trigger (T1.7) are superseded.

| Spec (old) | Actual (canonical) |
|---|---|
| Table: `profiles` | Table: `students` |
| Column: `parental_consent_status` | Column: `account_status` |
| Values: `pending / granted / denied / not_required` | Values: `pending_age_check / pending_consent / active / declined / suspended` |
| Column: `is_minor` (computed) | Not present — age computed at runtime in `getAgeFromDob()` |
| Table: `consent_audit_log` | Table: `consent_log` |
| Auto-creation via DB trigger | Manual insert in `app/api/auth/signup/route.ts` |

---

## 🔴 Immediate Next Actions (Session 4)

1. **Validate S1-F-01** against T1.1 + T1.4 using the checklist in `Story_Coverage_Map.md`
   - Check DB column shape of actual `students` rows in Supabase
   - Check RLS policies are actually applied
   - Check `consent_log` event_types being written
   - Fix anything that doesn’t match before moving on
2. **Wire up Resend** — S1-F-04 / S1-F-09
   - Branch: `feat/s1-f04-s1-f09-email`
   - Decide sending domain first: `onboarding@resend.dev` (immediate) or custom domain (correct but needs DNS)
   - Read T1.4 in full before writing a single line of code
3. **Create `student_subjects` table** (T1.1 gap) before S1-F-05 work begins

---

## Open Questions

1. **Resend sending domain**: `onboarding@resend.dev` to unblock now, or custom domain (e.g. `hello@aceos.app`)? DNS verification needed for custom domain.
2. **Google OAuth (S1-F-02)**: Still needs a Google Cloud project + OAuth 2.0 credentials. Redirect URI: `https://olybgkhggqnmrfcjjojy.supabase.co/auth/v1/callback`. Not blocking current work.

---

## Known Issues

| Issue | Status | Notes |
|---|---|---|
| Verification email not sent after signup | 🔲 Open | By design — Resend not wired. S1-F-04 fixes this. |
| `/forgot-password` returns 404 | 🔲 Open | Page not built. S1-F-10 / T1.11. |
| `/legal/*` returns 404 | 🔲 Open | Legal pages not built. T1.6. |
| `student_subjects` table not created | 🔲 Open | Needed before S1-F-05. |
| RLS policies not verified in production | 🔲 Open | S1-F-01 validation step will catch this. |
| Google OAuth: `unsupported provider` (400) | 🔲 Open | Not Sprint 1 priority. |

---

## Environment Variables

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Required for `auth.admin.*` calls. Never expose to browser. |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | `https://aceos-ai.vercel.app` (must include `https://`) |
| `RESEND_API_KEY` | ✅ Set | Key exists in Vercel. Not yet wired in code. |
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
2. Read `docs/phase-1/epic-1/Story_Coverage_Map.md` — this is the canonical source for what to work on next
3. For each story being picked up, read the linked technical story before writing any code
4. **First task: validate S1-F-01** using the checklist in `Story_Coverage_Map.md`
5. After validation: move to `feat/s1-f04-s1-f09-email` — wire Resend for email verification + parental consent
6. Confirm Resend sending domain with Dhruv before starting email work
