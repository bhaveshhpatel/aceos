# AceOS — Project Status

> **How to use this file:**
> At the start of every new chat thread say: **"read the project status"**
> I will pull this file and immediately know exactly where we are.
> Update this file at the end of every working session.

---

## Last Updated
April 27, 2026 — Session with Perplexity AI (GitHub + Supabase MCP connectors)

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
| S1-F-01 | Email Sign-Up | P0 | ✅ **CLOSED** (April 27, 2026) |
| S1-F-02 | Google OAuth Sign-Up & Sign-In | P0 | ✅ Complete |
| S1-F-03 | Age Gate & Parental Consent Flow | P0 | ❌ Not started |
| S1-F-04 | Email Verification (Resend wiring) | P0 | 🔄 **NEXT** |
| S1-F-05 | Student Onboarding: AP Subject Selection | P0 | ❌ Not started |
| S1-F-06 | Student Dashboard Shell | P0 | ❌ Not started |
| S1-F-07 | Session Persistence & Sign-Out | P0 | ✅ Complete (middleware + useAuth hook) |
| S1-F-08 | Privacy Policy & Terms of Service Acceptance | P0 | ✅ Complete (checkbox + consent_log) |
| S1-F-09 | Parental Consent Email Delivery | P0 | 🔄 **NEXT** (alongside S1-F-04) |
| S1-F-10 | Account Recovery (Forgot Password) | P1 | ❌ Not started |

**Build order:** S1-F-04 + S1-F-09 (Resend) → S1-F-03 → S1-F-05 → S1-F-06 → S1-F-10 → Vercel deploy

---

### S1-F-01 — Closed. Full Sign-Off Record.

**What was built:**

| File | What it does |
|---|---|
| `app/api/auth/signup/route.ts` | POST handler — creates auth user, writes `students`, `consent_log`, `auth_event_log`, generates verify link via Resend, full rollback on any failure |
| `app/auth/callback/route.ts` | Handles Supabase email callback — sets `email_verified=true`, writes `email_verified` to `auth_event_log`, routes by `account_status` |
| `types/auth.ts` | Zod schema — all fields, password rules (uppercase + number + 8 chars), DOB range (10–100 years), `accept_terms: literal(true)` |
| `middleware.ts` | Route protection — public paths pass through, unauthenticated users redirected to `/signin?next=<path>`, signed-in users redirected off `/signin`+`/signup` |

**Two-log architecture (T1.1):**
- `consent_log` — legal document acceptance only. Columns: `document_type`, `version`, `accepted_at`, `ip_address`, `user_agent`
- `auth_event_log` — auth lifecycle events only. Columns: `event_type`, `actor_email`, `ip_address`, `user_agent`, `metadata`
- Adults write `age_verified_adult` to `auth_event_log` at signup. Minors do not.
- `/auth/callback` writes `email_verified` to `auth_event_log` on successful verification.

**Rollback branches:**
1. `students` INSERT fails → `deleteUser(userId)` → 500 `SIGNUP_FAILED`
2. `generateLink` fails → `deleteUser(userId)` → 500 `SIGNUP_FAILED`
3. Resend `emails.send` fails → `deleteUser(userId)` → 500 `SIGNUP_FAILED`

**`account_status` logic:**
- DOB < 18 years ago → `pending_age_check`
- DOB >= 18 years ago → `active`

**DB enums verified live on Supabase (April 27, 2026):**

| Enum | Values |
|---|---|
| `account_status` | `pending_age_check`, `pending_consent`, `active`, `declined`, `suspended` |
| `auth_event_type` | `age_verified_adult`, `email_verified`, `consent_email_sent`, `consent_granted`, `consent_denied`, `consent_revoked` |
| `consent_document_type` | `privacy_policy`, `terms_of_service`, `parental_consent` |

**Test suite (all green, CI confirmed April 27, 2026):**

| File | Tests | Coverage |
|---|---|---|
| `signup-api.test.ts` | 23 | Happy path, `generateLink` contract, `account_status`, two-log shape, validation, 409, all 3 rollback branches |
| `schemas.test.ts` | 15 | All Zod schema rules |
| `signin-api.test.ts` | 5 | Sign-in flow |
| `utils.test.ts` | 8 | Auth utilities |
| `middleware.test.ts` | ~50 | `isPublicPath` (exact, sub-path, false-positives), routing decisions (public pass-through, auth-page redirect, protected redirect, authenticated pass-through) |

**CI:** 163 tests passing across 13 files. 0 failures.

**Key fix applied this session:**
- `vi.hoisted()` pattern applied to `signup-api.test.ts` — all mock fn declarations moved into `vi.hoisted()` to prevent TDZ `ReferenceError` when Vitest hoists `vi.mock()` factories.
- `middleware.test.ts` rewritten from `NextRequest`-based approach (incompatible with jsdom) to pure logic functions — tests `isPublicPath` and `resolveDestination()` directly.

---

### ✅ Sprint 2 Technical — COMPLETE

| Story | Title | Status |
|---|---|---|
| TS2-01 | Modal STEM Sandbox | ✅ Files pushed, Modal deploy still needed |
| TS2-02 | AI Gateway | ✅ `lib/ai/gateway.ts`, `model_map.json` |
| TS2-03 | Prompt Template System | ✅ 7 prompt files + registry + renderer |
| TS2-04 | Error Handling | ✅ `AIError`, `handleAIError`, Zod schema |
| TS2-05 | QA Harness | ✅ `scripts/qa/harness.ts` + types |

**Overall test suite CI status:** 163/163 tests green across 13 files.

---

### ❌ Sprint 2 Functional — NOT STARTED
Diagnostic flow, MCQ engine, FRQ grader UI. Starts after Sprint 1 Functional is complete.

---

## CI/CD Pipeline Status

### GitHub Actions — `.github/workflows/preview.yml`
- **Trigger:** `pull_request` to `main` (opened, synchronize, reopened)
- **What it does:** Runs Vitest unit tests only — deploy is handled by Vercel natively
- **Status:** ✅ Fully working — 163 tests green

### Vitest Testing Constraints (important for AI context)
- **Environment:** `jsdom` — NOT Next.js edge runtime
- **Consequence:** `NextRequest` / `NextResponse.next({ request: { headers } })` cannot be used in tests — throws `request.headers must be an instance of Headers`
- **Pattern:** Middleware tests must test pure logic functions extracted from the middleware, not the middleware function itself
- **Full redirect behaviour** (status codes, cookies) → Playwright E2E tests only

---

## Infrastructure Status

### Supabase
- **Project:** `aceos` — `olybgkhggqnmrfcjjojy` — us-west-1 — ACTIVE_HEALTHY
- **Migrations applied:** `ai_usage_log`, `sprint_1_auth_schema`, `add_products_table_and_product_scoping`
- **RLS:** Enabled on all 6 auth tables. `consent_log` + `auth_event_log` INSERT/SELECT locked to `service_role` only.
- **Indexes:** `idx_consent_log_student_id`, `idx_auth_event_log_student_id` confirmed.
- **`SUPABASE_SERVICE_ROLE_KEY`:** ❌ NOT yet set in Vercel env vars — required before first deploy

### Vercel
- **Native Git integration:** ⚠️ Manual dashboard steps still needed
- **Production branch:** `main`

### Railway
- Not needed until Sprint 2 Functional

### Modal.com STEM Sandbox
- **Files:** ✅ pushed to `modal_sandbox/`
- **Deployed:** ❌ NOT deployed — not blocking Sprint 1

---

## Open PRs

| Branch | Purpose | Status |
|---|---|---|
| `ci/verify-preview-pipeline` | CI pipeline setup + Vercel native integration switch | ✅ Ready to merge after Vercel dashboard steps are confirmed |

> PR #3 (`test: middleware route protection unit tests`) — **CLOSED** April 27, 2026. Superseded by direct push to `main` (commit `b62432b`). The PR's approach of testing an inlined copy of `isPublicPath` was correct; the replacement on `main` uses the same approach but also covers routing decision logic.

---

## Product Manual Steps Still Outstanding (Phase 1)

1. **Write Privacy Policy** — required before any user can complete sign-up
2. **Write Terms of Service** — same as above
3. **Write parental consent email copy** — needed for S1-F-09 (approve/decline template)

---

## All Decisions Made

- No local development — all changes via GitHub + Supabase MCP connectors
- AceOS is a multi-product suite — all code written product-scoped from Day 1
- URL structure is product-scoped: `/onboarding/[product]/...`, `/[product]/dashboard`
- `products` table is the source of truth for suite products — never hardcode product names in schema
- `lib/sip/` is the only place that reads the Student Intelligence Profile
- All external vendors abstracted via `lib/providers/` — never import Resend/Stripe/PostHog directly in app code
- No Facebook OAuth — add Apple Sign-In + Clever SSO in Phase 4
- Sprint 2 Technical built before Sprint 1 Functional intentionally (infra-first)
- Deploy to Vercel only after Sprint 1 Functional is fully complete
- Railway not needed until Sprint 2 Functional
- Dark mode deferred to Phase 2
- Vercel deploy via native GitHub integration, NOT CLI — avoids 100/day free tier quota
- CI workflow only runs tests — Vercel native integration handles preview deploys
- Vitest environment is `jsdom` — middleware tests must use pure logic, not Next.js runtime objects
- `vi.hoisted()` required for any mock fn referenced inside a `vi.mock()` factory

---

## Immediate Next Steps

1. **S1-F-04** — Resend email verification wiring (verify email template + delivery confirmation)
2. **S1-F-09** — Parental consent email delivery (consent_email_sent event, approve/decline links)
3. **S1-F-03** — Age Gate & Parental Consent UI (`/onboarding/score-boost-ap/age-gate`)
4. **S1-F-05** — AP Subject Selection (`/onboarding/score-boost-ap/subjects`)
5. **S1-F-06** — Student Dashboard Shell (`/score-boost-ap/dashboard`)
6. **S1-F-10** — Forgot Password flow
7. **Vercel dashboard** — connect repo + set `SUPABASE_SERVICE_ROLE_KEY` + enable preview deploys
8. **End of sprint** — Vercel production deploy

---

*Updated: April 27, 2026 | S1-F-01 closed | CI 163/163 green | Next: S1-F-04 + S1-F-09*
