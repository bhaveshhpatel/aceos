# AceOS — Deployment Checklist

> Last updated: 2026-04-26
> Run through this before every production deployment and when onboarding to a new environment.

---

## Vercel Environment Variables

All variables must be set in Vercel → aceos → Settings → Environment Variables for **Production**, **Preview**, and **Development**.

| Variable | Required | Value / Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | From Supabase → Settings → API. **Never expose to browser.** |
| `NEXT_PUBLIC_APP_URL` | ✅ | Must include `https://` prefix. e.g. `https://aceos-ai.vercel.app` |
| `RESEND_API_KEY` | ✅ | From Resend dashboard. Required for S1-F-02+. |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⚠️ Optional | PostHog analytics. App works without it. |

## GitHub Actions Secrets

Set in GitHub → bhaveshhpatel/aceos → Settings → Secrets → Actions.

| Secret | Required | Notes |
|---|---|---|
| `VERCEL_TOKEN` | ✅ | From vercel.com/account/tokens |
| `VERCEL_ORG_ID` | ✅ | From Vercel → aceos → Settings → General |
| `VERCEL_PROJECT_ID` | ✅ | From Vercel → aceos → Settings → General |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Used in CI test runs |
| `OPENAI_API_KEY` | ⚠️ Sprint 2+ | Not needed for Sprint 1 |
| `GROQ_API_KEY` | ⚠️ Sprint 2+ | Not needed for Sprint 1 |

---

## Pre-Deploy Checks

- [ ] All Vitest tests pass locally (`npm test`)
- [ ] `npm run build` passes locally without errors
- [ ] No `.env.local` secrets committed to git
- [ ] All new env vars added to Vercel before deploying
- [ ] PR has green CI before merging to main

---

## Post-Deploy Verification

### Auth Flow (S1-F-01)
- [ ] Navigate to `/signup` — form renders correctly
- [ ] Fill all 6 fields (first name, last name, email, password, DOB, ToS checkbox) and submit
- [ ] Network tab shows `POST /api/auth/signup → 201`
- [ ] Redirected to `/verify-email`
- [ ] Supabase → Authentication → Users — new user appears
- [ ] Supabase → Table Editor → `students` — row exists with correct data
- [ ] Supabase → Table Editor → `consent_log` — 2 rows (ToS + Privacy Policy)

### Email (S1-F-02 — once implemented)
- [ ] Verification email received after signup
- [ ] Email link redirects to `/auth/callback?product=score-boost-ap&next=/onboarding/score-boost-ap/age-gate`

### CI/CD
- [ ] Push to main triggers GitHub Actions `deploy.yml`
- [ ] Deploy job only runs after Vitest passes
- [ ] Vercel deployment completes successfully

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| Build error: `TypeError: Invalid URL` | `NEXT_PUBLIC_APP_URL` missing `https://` prefix | Add `https://` to the value in Vercel env vars |
| Build error: `Failed to collect page data for /_not-found` | Missing `app/not-found.tsx` | File now exists — should not recur |
| Signup POST returns 405 | Middleware intercepting `/api/auth/signup` | Fixed — `/api/auth` added to `PUBLIC_PATHS` |
| Signup does nothing (no network request) | Missing `SUPABASE_SERVICE_ROLE_KEY` | Set the key in Vercel env vars |
| Vercel not auto-deploying on push | Broken GitHub webhook | Use `deploy.yml` workflow instead — webhook no longer needed |
| Google OAuth: `unsupported provider` | Google provider not enabled in Supabase | Supabase → Authentication → Providers → Enable Google |
