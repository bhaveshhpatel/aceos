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
- **Stack:** Next.js 14, Supabase (PostgreSQL + Auth), TypeScript, Tailwind
- **AI layer:** OpenAI (GPT-4o) + Groq (Llama) via custom gateway, Modal.com for STEM sandbox
- **Repo:** https://github.com/bhaveshhpatel/aceos
- **Supabase project:** https://supabase.com/dashboard/project/olybgkhggqnmrfcjjojy
- **Supabase URL:** https://olybgkhggqnmrfcjjojy.supabase.co
- **No local development setup** — all changes pushed directly via GitHub MCP connector

---

## Epic & Sprint Structure (Phase 1)

| Epic | Sprints | Focus |
|---|---|---|
| Epic 1 — Foundation & Legal | Sprint 1 + Sprint 2 | Auth, infra, AI pipeline |

> There is no Sprint 3 in Epic 1. After Epic 1 is done, move to Epic 2.

---

## Current Sprint Status

### ✅ Sprint 2 Technical — COMPLETE (code pushed, tests green)

| Story | Title | Status |
|---|---|---|
| TS2-01 | Modal STEM Sandbox | ✅ Files pushed, Modal deploy still needed |
| TS2-02 | AI Gateway | ✅ `lib/ai/gateway.ts`, `model_map.json` |
| TS2-03 | Prompt Template System | ✅ 7 prompt files + registry + renderer |
| TS2-04 | Error Handling | ✅ `AIError`, `handleAIError`, Zod schema |
| TS2-05 | QA Harness | ✅ `scripts/qa/harness.ts` + types |

**CI Status:** GitHub Actions passing — 59/59 tests green (as of last fix commit `24de83b`)

---

### ❌ Sprint 2 Functional — NOT STARTED
Diagnostic flow, MCQ engine, FRQ grader UI. Depends on Sprint 1 Functional being built first.

---

### ❌ Sprint 1 Functional — NOT STARTED (THIS IS THE LOGICAL NEXT STEP)

| Story | Title | Priority |
|---|---|---|
| S1-F-01 | Email Sign-Up | P0 |
| S1-F-02 | Google OAuth Sign-Up & Sign-In | P0 |
| S1-F-03 | Age Gate & Parental Consent Flow | P0 |
| S1-F-04 | Email Verification | P0 |
| S1-F-05 | Student Onboarding: AP Subject Selection | P0 |
| S1-F-06 | Student Dashboard Shell | P0 |
| S1-F-07 | Session Persistence & Sign-Out | P0 |
| S1-F-08 | Privacy Policy & Terms of Service Acceptance | P0 |
| S1-F-09 | Parental Consent Email Delivery | P0 |
| S1-F-10 | Account Recovery (Forgot Password) | P1 |

**Start here in next session.** Begin with S1-F-01 (Email Sign-Up) + S1-F-02 (Google OAuth) in parallel.

---

### ✅ Sprint 1 Technical — PARTIALLY COMPLETE

| Item | Status |
|---|---|
| Next.js 14 project scaffold | ✅ |
| `package.json` + `tsconfig.json` | ✅ |
| `vitest.config.ts` | ✅ |
| GitHub Actions CI (`test.yml`) | ✅ Running on every push |
| Supabase project created (`aceos`) | ✅ `olybgkhggqnmrfcjjojy` in `us-west-1` |
| `lib/supabase/server.ts` | ✅ SSR-compatible server client |
| `ai_usage_log` migration | ✅ Applied with RLS + indexes |
| DB schema for Sprint 1 (students, consent_log, etc.) | ❌ Not yet applied |

---

## Infrastructure Status

### Supabase
- **Project:** `aceos` — `olybgkhggqnmrfcjjojy` — us-west-1 — ACTIVE_HEALTHY
- **Anon key:** in `.env.example` (safe to commit)
- **`ai_usage_log` table:** ✅ migrated
- **Auth tables (students, consent_log, etc.):** ❌ not yet — needed for Sprint 1 Functional
- **`SUPABASE_SERVICE_ROLE_KEY`:** ❌ NOT set anywhere yet — set this when starting Sprint 1 Functional
  - Get from: Supabase dashboard → Settings → API → service_role key
  - Add to: Railway/Vercel env vars AND GitHub repo secrets

### Modal.com STEM Sandbox
- **Files:** ✅ pushed to `modal_sandbox/`
- **Deployed:** ❌ NOT deployed yet — manual CLI step required
- **Steps:**
  1. Create Modal account at modal.com
  2. `pip install modal`
  3. `modal token set --token-id ak-xxx --token-secret as-xxx`
  4. `modal secret create aceos-modal-secrets MODAL_API_KEY=your-webhook-secret`
  5. `modal deploy modal_sandbox/app.py`
  6. Copy printed URL → set as `MODAL_SANDBOX_URL` in Railway/Vercel + GitHub Secrets
- **When needed:** Before Sprint 2 Functional (not blocking Sprint 1)

### GitHub Actions CI
- **Workflow:** `.github/workflows/test.yml` — runs on every push to `main`
- **Status:** ✅ 59/59 tests passing
- **Secrets needed in GitHub repo settings:**
  - `SUPABASE_SERVICE_ROLE_KEY` — add at Sprint 1 Functional start
  - `OPENAI_API_KEY` — add at Sprint 2 Functional start
  - `GROQ_API_KEY` — add at Sprint 2 Functional start
  - `MODAL_SANDBOX_URL` + `MODAL_API_KEY` — add after Modal deploy

---

## Key Files Reference

| File | Purpose |
|---|---|
| `DEPLOYMENT_CHECKLIST.md` | All secrets, when to set them, one-time manual steps |
| `.context/PROJECT_STATUS.md` | This file — session state for new threads |
| `docs/phase-1/epic-1/Sprint_1_Functional_Stories.md` | Full acceptance criteria for Sprint 1 Functional |
| `docs/phase-1/epic-1/Sprint_1_Technical_Stories.md` | Sprint 1 technical specs |
| `docs/phase-1/epic-1/Sprint_2_Technical_Stories.md` | Sprint 2 technical specs (TS2-01 → TS2-05) |
| `lib/ai/gateway.ts` | AI gateway — routes by model_map.json |
| `lib/ai/errors.ts` | AIError class + USER_FACING_ERRORS map |
| `lib/supabase/server.ts` | Supabase SSR server client |
| `modal_sandbox/app.py` | Modal STEM validation sandbox entrypoint |
| `model_map.json` | AI model routing config — 8 routes |

---

## Decisions Made This Session

- No local development — all changes via GitHub MCP connector directly
- `projects` Supabase project was paused (was an unused test project) to free up free tier slot
- New `aceos` Supabase project created in `us-west-1` (closest to Rio Vista, CA)
- `npm install` used instead of `npm ci` in CI (no lock file — no local setup)
- Sprint 2 Technical was built before Sprint 1 Functional intentionally (infra-first approach)
- Logical build order going forward: Sprint 1 Functional → Sprint 2 Functional

---

## Immediate Next Steps (Start of Next Session)

1. **Confirm CI is green** — check [Actions tab](https://github.com/bhaveshhpatel/aceos/actions)
2. **Build Sprint 1 Functional** — start with S1-F-01 (Email Sign-Up) + S1-F-02 (Google OAuth)
3. **Add `SUPABASE_SERVICE_ROLE_KEY`** to Railway/Vercel + GitHub Secrets when starting Sprint 1
4. **Apply Sprint 1 DB migrations** — `students`, `student_subjects`, `mastery_map`, `consent_log` tables

---

*Updated: April 26, 2026 | Sprint 2 Technical complete | Next: Sprint 1 Functional*
