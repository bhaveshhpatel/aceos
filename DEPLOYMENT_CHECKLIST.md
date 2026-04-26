# AceOS Deployment Checklist

This file tracks environment variables and manual steps that cannot be automated.
Review this before every deployment to a new environment (Railway, Vercel, etc.).

---

## ⚠️ Blocking: Environment Variables

These MUST be set in your deployment platform (Railway / Vercel environment settings).
**Never put these in the repo or in .env.example with real values.**

| Variable | Where to get it | Used by |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → `service_role` key | `lib/ai/logAIUsage.ts` — AI cost tracking writes |
| `OPENAI_API_KEY` | platform.openai.com → API keys | `lib/ai/gateway.ts` — GPT-4o routes |
| `GROQ_API_KEY` | console.groq.com → API keys | `lib/ai/gateway.ts` — Llama routes |
| `MODAL_API_KEY` | Modal dashboard → webhook secret you set | `app/api/validate-stem/route.ts` |
| `MODAL_TOKEN_ID` | Modal dashboard → Settings → API tokens | CLI deployment only |
| `MODAL_TOKEN_SECRET` | Modal dashboard → Settings → API tokens | CLI deployment only |

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
- [ ] Copy the printed deployment URL → set as `MODAL_SANDBOX_URL` in Railway/Vercel
- [ ] Verify cold start < 3 seconds, warm execution < 1 second

### Supabase
- [ ] Confirm `ai_usage_log` table exists (already migrated — Sprint 2)
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Railway/Vercel env vars
- [ ] Enable Supabase Auth email provider in dashboard
- [ ] Configure redirect URLs for OAuth (Sprint 1)

---

## Sprint Completion Gates

### Before Sprint 2 is marked done
- [ ] All vitest tests GREEN
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in deployment env
- [ ] Modal sandbox deployed and `MODAL_SANDBOX_URL` set
- [ ] `OPENAI_API_KEY` and `GROQ_API_KEY` set in deployment env
- [ ] 50-question QA audit run (`npx ts-node scripts/qa/pipeline_audit.ts`)
- [ ] ≥45/50 pass rate confirmed

---

*Last updated: Sprint 2 | April 2026*
