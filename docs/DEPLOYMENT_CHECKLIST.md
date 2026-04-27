# AceOS — Deployment Checklist

> Last updated: 2026-04-26
> Run through this before every production deployment and when setting up a new environment.

---

## Vercel Environment Variables

Set in Vercel → aceos → Settings → Environment Variables for **Production**, **Preview**, and **Development**.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Required | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Required | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | From Supabase → Settings → API. **Never expose to browser.** |
| `NEXT_PUBLIC_APP_URL` | ✅ Required | Must include `https://` prefix. e.g. `https://aceos-ai.vercel.app`. Missing prefix causes build failure. |
| `RESEND_API_KEY` | ✅ Required (S1-F-04+) | From Resend dashboard. Currently set but not used in code yet. |
| `OPENAI_API_KEY` | ⚠️ Sprint 2+ | Not needed for Sprint 1. |
| `GROQ_API_KEY` | ⚠️ Sprint 2+ | Not needed for Sprint 1. |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⚠️ Optional | Analytics. App works without it. |

---

## GitHub Actions Secrets

Set in GitHub → bhaveshhpatel/aceos → Settings → Secrets → Actions.

| Secret | Required | Notes |
|---|---|---|
| `VERCEL_TOKEN` | ✅ Required | From vercel.com/account/tokens |
| `VERCEL_ORG_ID` | ✅ Required | From Vercel → aceos → Settings → General |
| `VERCEL_PROJECT_ID` | ✅ Required | From Vercel → aceos → Settings → General |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | Used in Vitest CI runs (api route tests) |
| `OPENAI_API_KEY` | ⚠️ Sprint 2+ | |
| `GROQ_API_KEY` | ⚠️ Sprint 2+ | |

---

## Pre-Deploy Checks

- [ ] All Vitest tests pass locally: `npm test`
- [ ] `npm run build` completes without errors locally
- [ ] No `.env.local` or secrets committed to git (`git status` check)
- [ ] All new env vars added to Vercel before merging
- [ ] PR has green CI (Vitest + preview build) before merging to main
- [ ] Schema changes have a corresponding Supabase migration file under `supabase/migrations/`

---

## Post-Deploy Verification

### Auth Flow (S1-F-01 ✅)
- [ ] Navigate to `/signup` — form renders correctly
- [ ] Fill all 6 fields (first name, last name, email, password, DOB, ToS checkbox) and submit
- [ ] Network tab shows `POST /api/auth/signup → 201`
- [ ] Redirected to `/verify-email`
- [ ] Supabase → Authentication → Users — new user appears
- [ ] Supabase → Table Editor → `students` — row exists with correct `account_status` (`pending_age_check` if under 18, `active` if 18+)
- [ ] Supabase → Table Editor → `consent_log` — 2 rows (terms_of_service + privacy_policy)

### Email Verification (S1-F-04 — once implemented)
- [ ] Verification email received after signup
- [ ] Email link redirects correctly to `/auth/callback`
- [ ] `students.email_verified` set to `true` after click

### Parental Consent Email (S1-F-09 — once implemented)
- [ ] Under-18 signup triggers consent email to parent address
- [ ] Approve link activates student account (`account_status → active`)
- [ ] Decline link soft-deletes account

### CI/CD
- [ ] Push to main triggers `deploy.yml` in GitHub Actions
- [ ] Deploy job only starts after Vitest passes
- [ ] Vercel deployment URL appears in Actions run output
- [ ] Production URL serves updated code

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| Build error: `TypeError: Invalid URL` | `NEXT_PUBLIC_APP_URL` missing `https://` prefix | Add `https://` to value in Vercel env vars |
| Build error: `Failed to collect page data for /_not-found` | Missing `app/not-found.tsx` | File exists now — should not recur |
| Signup `POST /api/auth/signup` returns 405 | Middleware intercepting `/api/auth` routes | Fixed — `/api/auth` added to `PUBLIC_PATHS` in `middleware.ts` |
| Signup form submits but nothing happens | Missing `SUPABASE_SERVICE_ROLE_KEY` | Set key in Vercel env vars |
| Vercel not auto-deploying on git push | Broken GitHub webhook | `deploy.yml` workflow handles deploy — webhook no longer needed |
| Google OAuth returns 400 `unsupported_provider` | Google provider not enabled in Supabase | Supabase → Authentication → Providers → Enable Google + add Client ID/Secret |
| Tests fail: `NextRequest is not defined` | Vitest (jsdom) lacks edge runtime APIs | Do not instantiate NextRequest/NextResponse in Vitest — test pure logic only; use Playwright for full middleware e2e |
