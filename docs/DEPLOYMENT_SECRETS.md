# AceOS™ Deployment Environment Variables & Secrets Reference
### *Complete Configuration Guide for Vercel & GitHub Actions*
**Version 1.0 | April 2026**

---

## 📌 Executive Summary

This reference guide documents all environment variables and secrets required to deploy AceOS to **Vercel** and run automated CI/CD workflows in **GitHub Actions**.

To ensure end-to-end integration across Supabase, AI Providers, Modal STEM Validation, and Resend Email delivery, configure the properties below in your respective platform settings.

---

## 1. Vercel Dashboard Environment Variables

Configure these variables in **Vercel Project Settings → Environment Variables**.
Select **Production**, **Preview**, and **Development** environments for all keys.

| Variable Name | Environment | Description | Example / Location |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | All | Canonical base URL of the deployed application | `https://aceos-ai.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase Project API URL | `https://olybgkhggqnmrfcjjojy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase `anon` public key (safe for client) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase `service_role` key (**Server-only secret**) | Supabase Dashboard → Settings → API |
| `CONSENT_JWT_SECRET` | All | Secret string for signing parental consent JWTs | High-entropy string (min 32 chars) |
| `RESEND_API_KEY` | All | Resend Email API Key | Resend Dashboard → API Keys |
| `EMAIL_FROM` | All | Sender email address | `onboarding@resend.dev` |
| `OPENAI_API_KEY` | All | OpenAI API Key for FRQ grading & AI gateway | OpenAI Platform → API Keys |
| `GROQ_API_KEY` | All | Groq API Key for fast tutoring inference | Groq Console → API Keys |
| `MODAL_SANDBOX_URL` | All | Modal Python STEM validation webhook URL | `https://aceos-stem-validator--validate.modal.run` |
| `MODAL_API_KEY` | All | Webhook authorization bearer token for Modal | Modal App Settings |

---

## 2. GitHub Actions Secrets (CI/CD Pipeline)

Configure these secrets in **GitHub Repository Settings → Secrets and variables → Actions**.
These allow GitHub Actions (`.github/workflows/deploy.yml` & `ci.yml`) to run integration tests and trigger Vercel CLI production deployments automatically.

| Secret Name | Purpose |
|---|---|
| `VERCEL_TOKEN` | Vercel Personal Access Token for CLI deployments |
| `VERCEL_ORG_ID` | Vercel Account / Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Used during CI Vitest integration test execution |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used during CI Vitest integration test execution |
| `SUPABASE_SERVICE_ROLE_KEY` | Used during CI Vitest integration test execution |

---

## 3. End-to-End Verification Checklist

Once these variables and secrets are configured:

1. **Automated CI Build:** Every push to `main` will trigger `.github/workflows/deploy.yml`, executing Vitest unit tests and deploying directly to Vercel.
2. **Supabase Auth & Database:** Sign-up, Sign-in, Parental Consent email generation, and AP Subject Selection will execute cleanly against Supabase.
3. **AI Gateway:** FRQ essay evaluation (`/frq/[subject_slug]`) will route to OpenAI/Groq via `model_map.json`.
4. **Modal STEM Sandbox:** Numerical AP Calculus / Chemistry validation (`/api/validate-stem`) will execute sympy code in Modal.

---

*AceOS™ Deployment Guide | April 2026*
