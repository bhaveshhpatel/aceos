# AceOS Deployment Checklist

This file tracks environment variables and manual steps that cannot be automated.
Review this before every deployment to a new environment (Railway, Vercel, etc.).

---

## ⚠️ Blocking: Environment Variables

These MUST be set in your deployment platform (Railway / Vercel environment settings).
**Never put these in the repo or in .env.example with real values.**

Also needed as **GitHub Secrets** for CI to pass (Settings → Secrets → Actions).

| Variable | Where to get it | Set it when | Used by |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → `service_role` key | **Sprint 1 Functional** — when auth + DB writes are built | `lib/ai/logAIUsage.ts` — AI cost tracking writes |
| `OPENAI_API_KEY` | platform.openai.com → API keys | **Sprint 2 Functional** — when diagnostic/FRQ grader makes live AI calls | `lib/ai/gateway.ts` — GPT-4o routes |
| `GROQ_API_KEY` | console.groq.com → API keys | **Sprint 2 Functional** — same as above | `lib/ai/gateway.ts` — Llama routes |
| `MODAL_SANDBOX_URL` | Printed after `modal deploy modal_sandbox/app.py` | **After Modal is deployed** | `lib/ai/modal/callModalSandbox.ts` |
| `MODAL_API_KEY` | Webhook secret you set during Modal deploy | **After Modal is deployed** | `app/api/validate-stem/route.ts` |
| `MODAL_TOKEN_ID` | Modal dashboard → Settings → API tokens | **CLI deployment only** — not needed in Railway/Vercel | Modal CLI |
| `MODAL_TOKEN_SECRET` | Modal dashboard → Settings → API tokens | **CLI deployment only** — not needed in Railway/Vercel | Modal CLI |

## ✅ Already safe to commit (public keys)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | See `.env.example` |

---

## One-time Manual Steps

### Modal.com Sandbox
- [ ] Create Modal account at modal.com
- [ ] Set `MODAL_API_KEY` secret in Modal: `modal secret create aceos-modal-secrets MODAL_API_KEY=your-webhook-secret`
- [ ] Deploy sandbox: `modal deploy modal_sandbox/app.py`
- [ ] Copy the printed deployment URL → set as `MODAL_SANDBOX_URL` in Railway/Vercel **and** as a GitHub Secret
- [ ] Verify cold start < 3 seconds, warm execution < 1 second

### Supabase
- [ ] Confirm `ai_usage_log` table exists (already migrated — Sprint 2) ✅
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Railway/Vercel env vars ← **do this at Sprint 1 Functional**
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` as a GitHub Secret ← **same time**
- [ ] Enable Supabase Auth email provider in dashboard ← **Sprint 1 Functional**
- [ ] Configure redirect URLs for OAuth (Sprint 1) ← **Sprint 1 Functional**

---

## Sprint Completion Gates

### Before Sprint 2 Technical is marked done
- [ ] All vitest tests GREEN (GitHub Actions passing)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in deployment env + GitHub Secrets
- [ ] Modal sandbox deployed and `MODAL_SANDBOX_URL` set
- [ ] `OPENAI_API_KEY` and `GROQ_API_KEY` set in deployment env + GitHub Secrets
- [ ] 50-question QA audit run (`npx ts-node scripts/qa/pipeline_audit.ts`)
- [ ] ≥45/50 pass rate confirmed

### Before Sprint 1 Functional is marked done
- [ ] Auth flows work end-to-end (sign-up, verify, sign-in, sign-out)
- [ ] Age gate + parental consent flow complete
- [ ] Subject selection creates correct DB rows
- [ ] Dashboard shell loads with correct subjects
- [ ] All Sprint 1 acceptance criteria pass
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (needed for DB writes)
- [ ] Supabase Auth email provider enabled
- [ ] OAuth redirect URLs configured

---

*Last updated: Sprint 2 Technical complete | April 2026*
