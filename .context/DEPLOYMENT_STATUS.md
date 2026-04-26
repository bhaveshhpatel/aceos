# AceOS — Deployment Status

> **Last Updated:** April 26, 2026
> **Decision:** Deploy to Vercel at end of Sprint 1 Functional — not mid-sprint.

---

## Deployment Architecture

| Service | Purpose | When Needed |
|---|---|---|
| **Vercel** | Next.js frontend + API routes | End of Sprint 1 Functional |
| **Supabase** | PostgreSQL + Auth + Storage | ✅ Already live |
| **Railway** | AI inference microservice (Python) | Sprint 2 Functional |
| **Modal.com** | STEM code sandbox (Python execution) | Sprint 2 Functional |

**Key decision rationale:**
- There is no Railway service needed until Sprint 2 Functional. The current Next.js app is frontend + Supabase only.
- Railway enters the picture when the FRQ grading service and AI diagnostic engine are built.
- Vercel is the sole deployment target for Sprint 1.

---

## Current Deployment Status

| Platform | Status | Notes |
|---|---|---|
| Vercel | ❌ Not connected | Connect after Sprint 1 Functional is complete |
| Supabase | ✅ Live | `olybgkhggqnmrfcjjojy` — us-west-1 — ACTIVE_HEALTHY |
| Railway | ❌ Not needed yet | Sprint 2 Functional |
| Modal.com | ❌ Not deployed | Files in `modal_sandbox/` — manual CLI step |
| GitHub Actions CI | ✅ Running | 59/59 tests green |

---

## Vercel Deployment Checklist

Complete these steps in order at end of Sprint 1 Functional:

### Step 1 — Connect GitHub Repo
- [ ] Go to https://vercel.com/new
- [ ] Import `bhaveshhpatel/aceos` from GitHub
- [ ] Framework preset: **Next.js** (auto-detected)
- [ ] Root directory: `/` (default)
- [ ] Build command: `next build` (default)
- [ ] Output directory: `.next` (default)

### Step 2 — Set Environment Variables
Add all of these in Vercel Dashboard → Project → Settings → Environment Variables:

```
# Supabase — required for all environments
NEXT_PUBLIC_SUPABASE_URL=https://olybgkhggqnmrfcjjojy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API — NEVER expose to browser>

# App URL — set to your Vercel domain after first deploy
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Add these at Sprint 2 Functional (not needed for Sprint 1)
# OPENAI_API_KEY=
# GROQ_API_KEY=
# MODAL_SANDBOX_URL=
# MODAL_API_KEY=
```

> `NEXT_PUBLIC_` prefix = safe to expose to browser.
> Without `NEXT_PUBLIC_` prefix = server-only. Never leaked to client.

### Step 3 — Configure Supabase Auth Callback URL
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Set **Site URL** to: `https://your-project.vercel.app`
- [ ] Add to **Redirect URLs**: `https://your-project.vercel.app/auth/callback`
- [ ] If using a custom domain, also add that domain to Redirect URLs

### Step 4 — Enable Google OAuth Provider
- [ ] Go to Supabase Dashboard → Authentication → Providers → Google
- [ ] Toggle **Enable**
- [ ] Create a Google Cloud OAuth 2.0 Client ID:
  1. Go to https://console.cloud.google.com
  2. Create a new project (or use existing)
  3. Enable **Google+ API** or **Google Identity**
  4. Credentials → Create OAuth Client ID → Web Application
  5. Add authorized redirect URI: `https://olybgkhggqnmrfcjjojy.supabase.co/auth/v1/callback`
  6. Copy **Client ID** and **Client Secret**
- [ ] Paste Client ID + Client Secret into Supabase Google provider settings
- [ ] Save

### Step 5 — Deploy
- [ ] Push any final changes to `main`
- [ ] Vercel auto-deploys on push to `main`
- [ ] Verify build succeeds in Vercel dashboard
- [ ] Visit your Vercel URL — should redirect to `/signin`
- [ ] Test sign-up flow end-to-end
- [ ] Test Google OAuth flow end-to-end

### Step 6 — Update NEXT_PUBLIC_APP_URL
- [ ] Once deployed, update `NEXT_PUBLIC_APP_URL` in Vercel env vars to the actual domain
- [ ] Redeploy (or trigger a new push)

---

## GitHub Actions Secrets Needed

Add these in GitHub → Settings → Secrets and Variables → Actions:

| Secret | When | Source |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Before first Vercel deploy | Supabase dashboard → Settings → API |
| `OPENAI_API_KEY` | Sprint 2 Functional | OpenAI dashboard |
| `GROQ_API_KEY` | Sprint 2 Functional | Groq console |
| `MODAL_SANDBOX_URL` | After Modal deploy | Printed by `modal deploy` |
| `MODAL_API_KEY` | After Modal deploy | Set during Modal secret creation |

---

## Railway Deployment Plan (Sprint 2 Functional)

Railway is used for the AI inference microservice — **not the Next.js app**.

| Service | Language | Purpose |
|---|---|---|
| `aceos-ai-gateway` | Python / FastAPI | Routes AI requests to OpenAI + Groq |
| *(Optional)* `aceos-worker` | Python | Background job queue for FRQ grading |

**When to set up Railway:**
- Sprint 2 Functional: FRQ grading service + AI diagnostic engine
- Not needed for anything in Sprint 1

**Railway setup steps (future):**
1. Go to https://railway.app/new
2. Connect GitHub repo
3. Set root directory to `/services/ai-gateway` (to be created in Sprint 2)
4. Add env vars: `OPENAI_API_KEY`, `GROQ_API_KEY`, `MODAL_SANDBOX_URL`, `MODAL_API_KEY`
5. Deploy
6. Copy Railway service URL → add as `AI_GATEWAY_URL` in Vercel env vars

---

## Modal.com STEM Sandbox Deployment

Files already pushed to `modal_sandbox/`. Deploy when Sprint 2 Functional begins.

```bash
# One-time setup
pip install modal
modal token set --token-id ak-xxx --token-secret as-xxx
modal secret create aceos-modal-secrets MODAL_API_KEY=your-webhook-secret

# Deploy
modal deploy modal_sandbox/app.py
# └→ Copy printed URL → set as MODAL_SANDBOX_URL in Railway + Vercel + GitHub Secrets
```

---

## Custom Domain (Post-Sprint 1)

When you're ready to use a custom domain (e.g. `aceos.app`):
1. Add domain in Vercel Dashboard → Project → Domains
2. Add DNS records at your registrar (Vercel shows exact records)
3. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars
4. Add custom domain to Supabase Auth Redirect URLs
5. Update Google OAuth authorized redirect URIs in Google Cloud Console

---

*AceOS Deployment Status | Version 1.0 | April 2026*
*Update this file whenever deployment state changes.*
