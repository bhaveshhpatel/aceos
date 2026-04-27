# Sprint 1 — Technical Stories
## Epic 1: Foundation & Legal | Phase 1: ScoreBoost AP
**Sprints 1–2 | Weeks 1–2 | AceOS v1.0**

---

## Overview

These technical stories define the engineering implementation for Sprint 1. Every story is written so that a lead engineer can read it, derive Gherkin (Given/When/Then) scenarios, build an automation test suite, and implement the feature correctly — in that order.

**Test-Forward Requirement:** For every story below, tests are written BEFORE implementation. The acceptance criteria are the test specification.

**Coverage Map:** See `docs/phase-1/epic-1/Story_Coverage_Map.md` for the canonical mapping of functional stories to technical stories.

---

## T1.1 — Supabase Project Initialization & Schema Bootstrap

> **Schema Drift Notice — Updated 2026-04-26**
> Original spec used a `profiles` table. Actual implementation uses a `students` table with manual insertion in the API route. This story has been updated to reflect the implemented schema. The `profiles` table, `is_minor` computed column, and DB trigger (T1.7) are superseded. See T1.7 for the supersession notice.

> **Gap Fix — Session 4 (2026-04-26):** Added `mastery_data JSONB` column to `student_subjects`. This column is referenced in S1-F-05 AC-04 as the per-subject mastery record. Decision: JSONB on `student_subjects` (not a separate table) for Sprint 1 simplicity. Can be normalized in Sprint 2+ when mastery scoring logic is defined.

**As a** backend engineer,
**I need** the Supabase project configured with the correct database schema, RLS policies, and auth settings,
**So that** all subsequent features have a secure, consistent data foundation.

### Scope
- Supabase project exists (production: `olybgkhggqnmrfcjjojy`, region `us-west-1`)
- Initial migration creates all Phase 1 tables as documented below
- Row Level Security (RLS) enabled on every table
- Supabase Auth configured for email/password (Google OAuth is S1-F-02, not yet enabled)

### Database Schema — Canonical Implementation

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- students table (primary user record, extends auth.users)
-- NOTE: This table is inserted manually in the API route on signup.
-- There is NO database trigger. See T1.7 (superseded).
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  account_status TEXT NOT NULL CHECK (
    account_status IN ('pending_age_check', 'pending_consent', 'active', 'declined', 'suspended')
  ) DEFAULT 'pending_age_check',
  parent_email TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- consent_log (immutable audit trail for all consent events)
CREATE TABLE consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'tos_accepted',
      'privacy_policy_accepted',
      'consent_email_sent',
      'consent_granted',
      'consent_denied',
      'consent_revoked',
      'age_verified_adult'
    )
  ),
  -- Sprint 1 convention: document_version is hardcoded "1.0" for tos_accepted
  -- and privacy_policy_accepted events. All other event types set this to NULL.
  -- When legal documents are updated, bump to "1.1", "2.0", etc.
  -- The signup API route must always pass document_version: "1.0" explicitly.
  document_version TEXT,
  actor_email TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_subjects (created during onboarding — Sprint 1 S1-F-05)
-- mastery_data stores per-subject mastery state as JSONB.
-- Sprint 1: initialized as {} on insert. Structure defined in Sprint 2 when
-- diagnostic + mastery scoring logic is implemented.
CREATE TABLE student_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  exam_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  mastery_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_code)
);

-- provider_config (PID model — runtime-swappable AI providers, Sprint 2+)
CREATE TABLE provider_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_key TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security Policies

```sql
-- students: users can only read/write their own row
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "students_update_own" ON students
  FOR UPDATE USING (auth.uid() = id);

-- consent_log: insert-only from server (service_role), no client reads
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_log_insert_service_only" ON consent_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "consent_log_no_client_read" ON consent_log
  FOR SELECT USING (FALSE);

-- student_subjects: student reads/writes only their own
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_select_own" ON student_subjects
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "subjects_insert_own" ON student_subjects
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "subjects_update_own" ON student_subjects
  FOR UPDATE USING (auth.uid() = student_id);
```

### Acceptance Criteria

```gherkin
Scenario: RLS prevents cross-user data access
  Given two students Alice and Bob exist in the database
  When Alice's JWT is used to query students WHERE id = Bob's id
  Then the result set is empty
  And no error is thrown (silent deny)

Scenario: Service role can write to consent_log
  Given a server-side Supabase client using service_role key
  When it inserts a consent_log record for a student
  Then the insert succeeds
  And the record is retrievable by service_role

Scenario: Client cannot read consent_log
  Given an authenticated student JWT
  When the client queries consent_log
  Then zero rows are returned regardless of filter

Scenario: students row shape is correct after signup
  Given a successful email signup for student "Maria Chen", dob 2000-01-15
  Then a students row exists with:
    | column               | value                                            |
    | id                   | matches auth.users uid                           |
    | email                | submitted email                                  |
    | first_name           | "Maria"                                          |
    | last_name            | "Chen"                                           |
    | dob                  | 2000-01-15                                       |
    | account_status       | "active" (adult) or "pending_age_check" (minor)  |
    | email_verified       | false                                            |
    | onboarding_completed | false                                            |

Scenario: account_status transitions are valid
  Given a student row with account_status = 'pending_age_check'
  When updated to 'pending_consent'
  Then the update succeeds
  When updated to an invalid value 'unknown'
  Then the update is rejected by the CHECK constraint

Scenario: consent_log event_type constraint is enforced
  Given a service_role client
  When it inserts a consent_log row with event_type = 'invalid_event'
  Then the insert is rejected with a constraint violation error

Scenario: consent_log document_version is written for legal events
  Given a successful adult signup
  When the consent_log rows for 'tos_accepted' and 'privacy_policy_accepted' are read
  Then both rows have document_version = '1.0'
  And the 'age_verified_adult' row has document_version = NULL

Scenario: mastery_data initializes as empty object on subject insert
  Given a student selects AP Chemistry during onboarding
  When the student_subjects row is created
  Then mastery_data = '{}'
  And no error is thrown on insert
```

### Implementation Notes
- `students` record is inserted manually in `app/api/auth/signup/route.ts` using the service role client
- No DB trigger exists for student creation — this is intentional (see T1.7)
- `updated_at` is managed at the application layer, not via trigger
- All migrations must be version-controlled under `supabase/migrations/`
- Migration file naming: `YYYYMMDDHHMMSS_description.sql`
- Staging and production must be separate Supabase projects — never share a database
- `document_version` must be passed explicitly as `"1.0"` for `tos_accepted` and `privacy_policy_accepted` events. It is NOT a DB default — the API route is responsible for setting it.

---

## T1.2 — Vercel Deployment Pipeline

**As a** DevOps engineer,
**I need** a CI/CD pipeline deploying the Next.js app to Vercel on every push to `main`,
**So that** the team can ship to production with confidence after tests pass.

> **Implementation Note:** The pipeline uses Vercel CLI API approach (not `amondnet/vercel-action` as originally specced). This works reliably and is the actual implementation. Spec updated to match.

### Actual Pipeline Files

```
.github/workflows/test.yml     — runs Vitest on push + PR to main
.github/workflows/preview.yml  — preview build check on PR to main
.github/workflows/deploy.yml   — runs tests then deploys to Vercel production on push to main
```

### Environment Variable Schema

```
# .env.local (never committed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=           # must include https:// prefix
VERCEL_TOKEN=                  # GitHub Actions secret only
VERCEL_ORG_ID=                 # GitHub Actions secret only
VERCEL_PROJECT_ID=             # GitHub Actions secret only
OPENAI_API_KEY=                # Sprint 2+
GROQ_API_KEY=                  # Sprint 2+
```

### Acceptance Criteria

```gherkin
Scenario: Push to main triggers production deployment
  Given a commit is pushed to main
  When CI tests pass
  Then production deployment completes within 5 minutes
  And https://aceos-ai.vercel.app serves the updated code

Scenario: Failed tests block deployment
  Given a push to main with a failing unit test
  When CI runs
  Then the deploy job does not execute
  And the commit is marked as failing

Scenario: Environment variables are not exposed in client bundle
  Given the production build is complete
  When the client-side JavaScript bundle is inspected
  Then SUPABASE_SERVICE_ROLE_KEY is not present in the bundle
  And RESEND_API_KEY is not present in the bundle

Scenario: NEXT_PUBLIC_APP_URL includes https:// prefix
  Given the env var is set to "https://aceos-ai.vercel.app"
  When new URL(process.env.NEXT_PUBLIC_APP_URL) is called in the API route
  Then no TypeError is thrown
```

---

## T1.3 — LiteLLM Gateway Configuration

> Sprint 2+. Not yet started. Original spec unchanged.

**As a** backend engineer,
**I need** LiteLLM deployed as an AI gateway with model routing via `model_map.json`,
**So that** any AI model can be swapped via config change with no application code changes.

### model_map.json Specification

```json
{
  "routes": {
    "grading_text": {
      "primary": "gpt-4o",
      "fallback": "gpt-4o-mini",
      "timeout_seconds": 30,
      "max_tokens": 4096
    },
    "grading_stem": {
      "primary": "gpt-4o",
      "fallback": "gpt-4o-mini",
      "timeout_seconds": 45,
      "max_tokens": 4096,
      "supports_vision": true
    },
    "tutor_response": {
      "primary": "groq/llama-3.1-70b-versatile",
      "fallback": "gpt-4o-mini",
      "timeout_seconds": 10,
      "max_tokens": 1024
    },
    "diagnostic_explanation": {
      "primary": "groq/llama-3.1-70b-versatile",
      "fallback": "gpt-4o-mini",
      "timeout_seconds": 10,
      "max_tokens": 512
    },
    "score_prediction": {
      "primary": "gpt-4o-mini",
      "fallback": "groq/llama-3.1-70b-versatile",
      "timeout_seconds": 15,
      "max_tokens": 256
    }
  },
  "cost_controls": {
    "max_monthly_spend_usd": 500,
    "alert_threshold_usd": 400
  }
}
```

### AI Client Abstraction Layer

```typescript
// lib/ai/client.ts
export type RouteKey = keyof typeof MODEL_ROUTES;

export interface AIRequestParams {
  route: RouteKey;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  imageUrl?: string;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
}

export async function callAI(params: AIRequestParams): Promise<AIResponse> {
  // Routes through LiteLLM gateway — never calls vendor SDK directly
}
```

### Acceptance Criteria

```gherkin
Scenario: Route key determines model selection
  Given model_map.json has grading_text mapped to gpt-4o
  When callAI is invoked with route: "grading_text"
  Then the request is sent to the gpt-4o endpoint
  And AIResponse.model_used = "gpt-4o"

Scenario: Fallback triggers on primary model failure
  Given gpt-4o returns a 503 error
  When callAI is invoked with route: "grading_text"
  Then the request is retried with gpt-4o-mini
  And AIResponse.model_used = "gpt-4o-mini"

Scenario: Model swap requires only config change
  Given model_map.json grading_text is changed from gpt-4o to claude-3-5-sonnet
  When the config is reloaded (no code deploy)
  Then subsequent grading_text calls use claude-3-5-sonnet
  And no application code was modified

Scenario: Timeout is enforced per route
  Given grading_text has timeout_seconds: 30
  When the AI model does not respond within 30 seconds
  Then callAI throws a TimeoutError
  And the error is caught and a user-visible fallback message is shown
```

### Implementation Notes
- `callAI` is the ONLY function in the codebase that calls any AI vendor
- No component, API route, or server action may import an OpenAI/Anthropic/Groq SDK directly
- All prompt templates live in `lib/ai/prompts/` as versioned `.ts` files — never inline strings

---

## T1.4 — Authentication System Implementation

> **Updated 2026-04-26 (Session 3):** State machine corrected to use `students` table and actual `account_status` values. Consent token expiry corrected to 7 days. Email verification + forgot password scenarios added.
>
> **Gap Fix — Session 4 (2026-04-26):** `consent_log.document_version` convention documented. Sprint 1 hardcodes `"1.0"` for `tos_accepted` and `privacy_policy_accepted` events. All other event types write `NULL`. See T1.1 schema notes for full convention.

**As a** backend engineer,
**I need** email/password authentication with an age-gate flow, email verification, parental consent email delivery, and password recovery,
**So that** the app is FERPA-compliant and fully functional for auth before Sprint 2.

**Covers:** S1-F-01, S1-F-03, S1-F-04, S1-F-09, S1-F-10
**Does NOT cover:** S1-F-02 (Google OAuth — see T1.4b below, descoped to Sprint 2), S1-F-07 (session persistence — T1.9)

### Auth Flow State Machine

```
[POST /api/auth/signup]
    → validate fields (Zod schema)
    → supabase.auth.admin.createUser()
    → insert students row (service role)
    → insert consent_log rows:
        'tos_accepted'           { document_version: '1.0' }
        'privacy_policy_accepted' { document_version: '1.0' }
    → compute age from dob
    → if age >= 18:
        → update students.account_status = 'active'
        → insert consent_log: 'age_verified_adult'  { document_version: NULL }
        → supabase.auth.admin.generateLink({ type: 'signup' })  ← link generated, NOT sent (Resend wired in S1-F-04)
        → redirect to /verify-email
    → if age < 18:
        → update students.account_status = 'pending_age_check'
        → redirect to /onboarding/consent  ← student enters parent email here (T1.12)
    → on any failure: rollback (delete auth user if students insert fails)

[POST /api/auth/consent/send]
    → validate parent_email
    → generate signed JWT: { student_id, parent_email, exp: now + 7 days }
    → send consent email via Resend to parent_email
    → update students.account_status = 'pending_consent'
    → insert consent_log: 'consent_email_sent'  { document_version: NULL }

[GET /api/auth/consent/approve?token=X]
    → verify JWT signature + expiry
    → if expired → redirect to /auth/consent-expired
    → if already actioned → redirect to /auth/consent-already-actioned
    → update students.account_status = 'active'
    → insert consent_log: 'consent_granted'  { document_version: NULL }
    → send confirmation email to student via Resend

[GET /api/auth/consent/deny?token=X]
    → verify JWT signature + expiry
    → update students.account_status = 'declined'
    → insert consent_log: 'consent_denied'  { document_version: NULL }
    → delete auth.users record (FERPA — no data retained without consent)

[POST /api/auth/verify-email]
    → Supabase handles OTP/link verification natively
    → on verified: update students.email_verified = true
    → redirect: if account_status = 'active'           → /onboarding/subjects
               if account_status = 'pending_age_check' → /onboarding/consent
               if account_status = 'pending_consent'   → /onboarding/awaiting-consent

[POST /api/auth/forgot-password]
    → accept email input
    → always return same success response (no account enumeration)
    → if email exists: supabase.auth.resetPasswordForEmail(email, { redirectTo })
    → reset link expires in 1 hour (Supabase default)

[POST /api/auth/reset-password]
    → accept new password
    → validate: min 8 chars, 1 uppercase, 1 number
    → supabase.auth.updateUser({ password: newPassword })
    → redirect to /signin with success banner
```

### Consent Email Specification (via Resend)

```
From:    hello@aceos.app  (or onboarding@resend.dev until domain verified)
Subject: Your approval is needed for [Student First Name]'s AceOS account

Hi [Parent/Guardian],

[Student First Name] ([Student Email]) signed up for AceOS — an AI-powered
AP exam prep platform that helps students improve their scores.

AceOS stores academic data including practice scores. Because [Student First Name]
is under 18, we need your permission before storing any data.

[APPROVE ACCESS]  → https://aceos-ai.vercel.app/api/auth/consent/approve?token=JWT
[DECLINE ACCESS]  → https://aceos-ai.vercel.app/api/auth/consent/deny?token=JWT

This link expires in 7 days. No data has been stored yet.

Privacy Policy: https://aceos-ai.vercel.app/legal/privacy-policy
— The AceOS Team
```

### Consent JWT Specification

```typescript
interface ConsentTokenPayload {
  student_id: string;   // UUID
  parent_email: string;
  iat: number;          // issued at (Unix seconds)
  exp: number;          // iat + 7 * 24 * 60 * 60
}
// Algorithm: HS256
// Secret: SUPABASE_SERVICE_ROLE_KEY
// Library: jose
```

### API Route File Map

```
app/api/auth/signup/route.ts           — POST signup handler
app/api/auth/signin/route.ts           — POST signin handler
app/api/auth/signout/route.ts          — POST signout handler (see T1.9)
app/api/auth/consent/send/route.ts     — POST send parental consent email
app/api/auth/consent/approve/route.ts  — GET approve consent token
app/api/auth/consent/deny/route.ts     — GET deny consent token
app/api/auth/forgot-password/route.ts  — POST request password reset
app/api/auth/reset-password/route.ts   — POST set new password
app/api/auth/verify-email/route.ts     — handles post-verification redirect logic
```

### Acceptance Criteria

```gherkin
# S1-F-01 / S1-F-03 — Signup & Age Gate

Scenario: Adult signup creates correct DB state
  Given a user submits signup with dob 20 years ago
  When POST /api/auth/signup succeeds
  Then students.account_status = 'active'
  And consent_log contains 'tos_accepted' with document_version = '1.0'
  And consent_log contains 'privacy_policy_accepted' with document_version = '1.0'
  And consent_log contains 'age_verified_adult' with document_version = NULL
  And the user is redirected to /verify-email

Scenario: Minor signup creates correct DB state
  Given a user submits signup with dob 15 years ago
  When POST /api/auth/signup succeeds
  Then students.account_status = 'pending_age_check'
  And the user is redirected to /onboarding/consent

Scenario: Signup rolls back on students insert failure
  Given supabase.auth.admin.createUser() succeeds
  And the students insert throws an error
  When POST /api/auth/signup is called
  Then the auth.users record is deleted
  And no students row exists
  And the API returns 500 with a structured error

Scenario: Duplicate email returns correct error
  Given an email already registered in the system
  When POST /api/auth/signup is called with that email
  Then the API returns 409
  And the response body contains { error: 'EMAIL_ALREADY_EXISTS' }

# S1-F-09 — Parental Consent Email

Scenario: Consent email is sent within 2 minutes
  Given a minor student on /onboarding/consent submits a valid parent email
  When POST /api/auth/consent/send is called
  Then Resend dispatches the email within 2 minutes
  And students.account_status = 'pending_consent'
  And consent_log contains 'consent_email_sent'
  And the email subject contains the student's first name

Scenario: Parent approves consent
  Given a valid unexpired consent JWT
  When GET /api/auth/consent/approve?token=JWT
  Then students.account_status = 'active'
  And consent_log contains 'consent_granted'
  And a confirmation email is sent to the student

Scenario: Parent denies consent
  Given a valid unexpired consent JWT
  When GET /api/auth/consent/deny?token=JWT
  Then students.account_status = 'declined'
  And consent_log contains 'consent_denied'
  And auth.users record is deleted

Scenario: Expired consent token (7 days)
  Given a consent JWT with exp = 8 days ago
  When GET /api/auth/consent/approve?token=JWT
  Then the response redirects to /auth/consent-expired
  And students.account_status is unchanged

Scenario: Consent link is single-use
  Given a parent who already approved (students.account_status = 'active')
  When the same approval link is clicked again
  Then the response redirects to /auth/consent-already-actioned
  And no duplicate consent_log rows are created

# S1-F-04 — Email Verification

Scenario: Verified email updates students row
  Given a student clicks a valid Supabase verification link
  When the verification completes
  Then students.email_verified = true
  And if account_status = 'active' → redirect to /onboarding/subjects
  And if account_status = 'pending_age_check' → redirect to /onboarding/consent
  And if account_status = 'pending_consent' → redirect to /onboarding/awaiting-consent

Scenario: Expired verification link shows resend option
  Given a verification link more than 24 hours old
  When the student clicks it
  Then they see the message "This link has expired. Click below to resend."
  And a Resend Email button is available

# S1-F-10 — Forgot Password

Scenario: Reset email sent without revealing account existence
  Given any email submitted to POST /api/auth/forgot-password
  When the request is processed
  Then the response is always: { message: "If an account exists, we've sent a reset link" }
  And HTTP 200 is returned regardless of whether the email is registered

Scenario: Reset link expires after 1 hour
  Given a reset link more than 1 hour old
  When the student clicks it
  Then they see: "This reset link has expired. Please request a new one."

Scenario: New password must meet requirements
  Given a student on the reset password form
  When they submit a password shorter than 8 chars or missing uppercase or missing a number
  Then the specific failed rule is shown inline
  And supabase.auth.updateUser is NOT called

Scenario: Successful reset redirects to signin
  Given a student submits a valid new password
  When POST /api/auth/reset-password succeeds
  Then they are redirected to /signin
  And a success banner reads "Password updated. Please sign in."
```

### Implementation Notes
- Consent JWT signed with `jose` using `SUPABASE_SERVICE_ROLE_KEY` as HS256 secret
- `document_version: '1.0'` must be passed explicitly for `tos_accepted` and `privacy_policy_accepted` inserts — it is NOT a DB default
- Never use anon key to sign tokens
- All Resend calls must be server-side only
- Password reset uses Supabase native `resetPasswordForEmail` — do not implement custom token logic
- The delete-on-deny operation must use service role client

---

## T1.4b — Google OAuth Sign-Up & Sign-In ⏸ DESCOPED TO SPRINT 2

> **Status:** Technical story written in Session 4. Implementation descoped to Sprint 2 due to external dependency (Google Cloud OAuth project creation). **Calendar action required before Sprint 2 begins:** Create Google Cloud project, configure OAuth 2.0 consent screen, obtain client ID + secret, register redirect URI in Supabase.

**As a** backend/frontend engineer,
**I need** Google OAuth sign-in and sign-up integrated via Supabase Auth,
**So that** students can create and access their account with one click using their Google account.

**Covers:** S1-F-02

### Pre-Implementation Checklist (do BEFORE writing code)

```
☐ Create Google Cloud project at console.cloud.google.com
☐ Enable Google+ API / People API
☐ OAuth consent screen: set app name "AceOS", user type "External", add scopes: email, profile
☐ Create OAuth 2.0 Client ID → type: Web Application
☐ Authorized redirect URI: https://olybgkhggqnmrfcjjojy.supabase.co/auth/v1/callback
☐ Copy Client ID + Client Secret → add to Supabase Dashboard → Auth → Providers → Google
☐ Enable Google provider in Supabase Dashboard
☐ Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel env vars (for reference/audit only — Supabase handles the OAuth flow)
```

### OAuth Flow Architecture

```
[Client: /signup or /signin page]
    → user clicks "Continue with Google"
    → supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: NEXT_PUBLIC_APP_URL + '/auth/callback' } })
    → browser redirects to Google consent screen
    → Google redirects to Supabase callback URL
    → Supabase creates/updates auth.users entry
    → Supabase redirects to /auth/callback

[GET /auth/callback — Next.js route handler]
    → exchange code for session: supabase.auth.exchangeCodeForSession(code)
    → check if students row exists for this user id
    → if NO (new OAuth user):
        → check if age can be determined from Google profile (usually cannot — Google doesn't return DOB)
        → redirect to /onboarding/complete-profile  ← student provides first_name, last_name, dob
    → if YES (returning OAuth user):
        → check onboarding_completed
        → if false → /onboarding/subjects
        → if true  → /dashboard

[POST /api/auth/oauth/complete-profile]
    → accepts { first_name, last_name, dob }
    → inserts students row (service role)
    → inserts consent_log rows: 'tos_accepted', 'privacy_policy_accepted' (document_version: '1.0')
    → runs age check → same state machine as email signup
    → redirects to /verify-email (adults) or /onboarding/consent (minors)
```

### Page & Route Map

```
app/
  auth/
    callback/
      route.ts                    — GET: exchanges OAuth code for session, routes new vs returning users
  onboarding/
    complete-profile/
      page.tsx                    — form for first_name, last_name, dob (OAuth new users only)
  api/
    auth/
      oauth/
        complete-profile/
          route.ts                — POST: inserts students row, runs age gate
```

### Acceptance Criteria

```gherkin
Scenario: New Google user is routed to complete-profile
  Given a user who has never signed up to AceOS
  When they sign in with Google and are redirected to /auth/callback
  Then no students row exists for their uid
  And they are redirected to /onboarding/complete-profile

Scenario: Returning Google user with completed onboarding goes to dashboard
  Given a user with a students row and onboarding_completed = true
  When they sign in with Google
  Then they are redirected to /dashboard

Scenario: OAuth complete-profile follows same age gate as email signup
  Given a new Google user submits dob = 15 years ago
  When POST /api/auth/oauth/complete-profile is called
  Then students.account_status = 'pending_age_check'
  And they are redirected to /onboarding/consent

Scenario: Google sign-in button is present on signin and signup pages
  Given an unauthenticated user on /signin or /signup
  Then a "Continue with Google" button is visible
  And clicking it initiates the OAuth flow

Scenario: OAuth callback handles missing code gracefully
  Given /auth/callback is accessed without a code param
  Then the user is redirected to /signin
  And an error message: "Authentication failed. Please try again." is shown
```

### Implementation Notes
- Google does not return DOB in the OAuth profile — always route new Google users through `/onboarding/complete-profile` to collect it
- The ToS/Privacy checkbox must be shown on the complete-profile form (same consent requirement as email signup)
- Do not store the Google OAuth `access_token` — Supabase handles token management
- Supabase handles PKCE automatically when using `signInWithOAuth` — no custom PKCE implementation needed
- Use `@supabase/ssr` `createServerClient` in `/auth/callback/route.ts` (not browser client)

---

## T1.5 — Subject Selection Screen Implementation

> **Gap Fix — Session 4 (2026-04-26):** Max subjects corrected to 4 everywhere. Previous version had an inconsistency — server action comment said max 6, Gherkin said max 6, functional story S1-F-05 says max 4. Functional story wins. All references now say 4.

**As a** frontend engineer,
**I need** the subject selection screen to display the 6 Phase 1 AP subjects and persist selections to the database,
**So that** the student's study environment is initialized correctly.

**Covers:** S1-F-05

### Subject Registry (Phase 1)

```typescript
// config/subjects.ts
export const PHASE_1_SUBJECTS = [
  { code: 'AP_CHEM',         name: 'AP Chemistry',                       type: 'VISUAL', units: 9,  exam_date_2026: '2026-05-04', icon: '🧪' },
  { code: 'AP_BIO',          name: 'AP Biology',                         type: 'VISUAL', units: 8,  exam_date_2026: '2026-05-08', icon: '🧬' },
  { code: 'AP_CALC_AB',      name: 'AP Calculus AB',                     type: 'VISUAL', units: 10, exam_date_2026: '2026-05-04', icon: '∫'  },
  { code: 'AP_USHISTORY',    name: 'AP US History',                      type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-07', icon: '🇺🇸' },
  { code: 'AP_WORLDHISTORY', name: 'AP World History',                   type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-14', icon: '🌍' },
  { code: 'AP_LANG',         name: 'AP English Language & Composition',  type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-13', icon: '✍️' },
] as const;
```

### Server Action

```typescript
// app/actions/subjects.ts
'use server';

export async function saveSubjectSelections(
  studentId: string,
  selections: { subjectCode: string; examDate: string }[]
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate: min 1, max 4 subjects  ← CAP IS 4, NOT 6
  // 2. Upsert student_subjects records (with mastery_data: {})
  // 3. Update students.onboarding_completed = true
  // 4. Return success or structured error
}
```

### Acceptance Criteria

```gherkin
Scenario: Student sees all 6 Phase 1 subjects
  Given an authenticated student on /onboarding/subjects
  When the page loads
  Then exactly 6 AP subject cards are displayed
  And each card shows subject name, type badge (TEXT/VISUAL), and default exam date
  And all 6 subjects are unselected by default

Scenario: Minimum 1 subject enforced
  Given no subjects are selected
  When the student clicks "Continue"
  Then the message "Please select at least one AP subject to continue" is shown
  And no database write occurs

Scenario: Maximum 4 subjects enforced
  Given a student has already selected 4 subjects
  When they attempt to select a 5th
  Then the 5th subject card does not toggle to selected
  And a message appears: "You can add more subjects later from your dashboard"

Scenario: Subject rows created in database with mastery_data initialized
  Given a student selects AP Chemistry and AP US History and clicks Continue
  Then 2 rows exist in student_subjects with correct student_id and subject_code values
  And each row has mastery_data = '{}'
  And students.onboarding_completed = true
  And the student is redirected to /dashboard

Scenario: Exam date defaults to College Board 2026 date
  Given a student selects AP Chemistry
  Then the exam date field defaults to 2026-05-04
  And the student can override it

Scenario: Completed onboarding redirects away from subject select
  Given a student with onboarding_completed = true
  When they navigate directly to /onboarding/subjects
  Then they are redirected to /dashboard
```

---

## T1.6 — Privacy Policy & Terms of Service Legal Pages

**As a** frontend engineer,
**I need** the Privacy Policy and Terms of Service live at dedicated URLs,
**So that** we are legally compliant before any user signs up.

**Covers:** S1-F-08 (partially — checkbox logic is in signup form, covered by T1.4)

### Route Requirements

| Route | Content | Must Be Live Before |
|---|---|---|
| `/legal/privacy-policy` | Full FERPA-compliant privacy policy | First user signup |
| `/legal/terms-of-service` | ToS with minor provisions | First user signup |

### Acceptance Criteria

```gherkin
Scenario: Legal pages are accessible without auth
  Given an unauthenticated user
  When they navigate to /legal/privacy-policy or /legal/terms-of-service
  Then the full document text is displayed
  And no login is required

Scenario: Terms links are present on signup form
  Given a user on /signup
  Then the form contains a link to /legal/terms-of-service
  And a link to /legal/privacy-policy
  And both links open in a new tab

Scenario: Consent email links to Privacy Policy
  Given a parental consent email was sent
  When the parent views the email
  Then the email contains a clickable link to /legal/privacy-policy
  And the link resolves to the live page without redirecting to /signin

Scenario: Legal pages render correctly on mobile
  Given the Privacy Policy page
  When viewed on a 375px wide viewport
  Then all text is readable without horizontal scroll
  And no content is clipped
```

---

## T1.7 — Profile Auto-Creation Trigger ⛔ SUPERSEDED

> **Decision made 2026-04-26:** This story is superseded. The `students` row is created manually in the signup API route using the service role client. Do not implement.
>
> **Kept for audit trail only.**

---

## T1.8 — Error Boundary & Graceful Degradation

**As a** frontend engineer,
**I need** React error boundaries and structured error states on all auth and onboarding pages,
**So that** a user never sees a raw error or blank screen if any service fails.

**Covers:** Applies cross-cutting to S1-F-01, S1-F-03, S1-F-04, S1-F-05, S1-F-06, S1-F-07, S1-F-10

### Error State Specification

```typescript
// components/ErrorBoundary.tsx — class component
// On error: shows "Something went wrong" + "Reload page" button
// Reports to console.error (Sentry integration Sprint 2+)

interface ApiError {
  error: string;    // machine-readable SCREAMING_SNAKE_CASE code
  message: string;  // human-readable, safe to display
  status: number;   // HTTP status
}

// Error messages:
// Network offline    → "You're offline. Check your connection and try again."
// Auth failure       → "Sign in failed. Please try again."
// Server action err  → "Something went wrong. Your data has not been saved."
// Timeout            → "This is taking longer than expected. Please try again."
// Duplicate email    → "An account with this email already exists. Sign in instead?"
```

### Acceptance Criteria

```gherkin
Scenario: Auth failure shows user-friendly message
  Given Supabase returns a 500 error during sign-in
  When the user submits the sign-in form
  Then "Sign in failed. Please try again." is displayed
  And the raw Supabase error is never shown

Scenario: Offline state is communicated
  Given the user's device is offline
  When they submit the signup form
  Then "You're offline. Check your connection and try again." is shown
  And the form fields retain their values

Scenario: Error boundary catches render crash
  Given any child component throws an unhandled error
  When the error boundary catches it
  Then a fallback UI is shown with a "Reload page" button

Scenario: Loading states prevent double-submit
  Given a user submits the signup form
  When the server action is in flight
  Then the submit button is disabled and shows a loading spinner
  And a second click has no effect

Scenario: API error codes are machine-readable
  Given any API route returns an error
  Then the response body shape is { error: string, message: string, status: number }
  And the error field is SCREAMING_SNAKE_CASE
```

---

## T1.9 — Session Management & Sign-Out

> **Gap Fix — Session 4 (2026-04-26):** Added redirect param validation guard. The middleware must validate the `redirect` param before following it. Specifically: never redirect to `/onboarding/*` if the student's `onboarding_completed = true`. This prevents a redirect loop where a student with completed onboarding is bounced back into the onboarding flow after session expiry.

**As a** backend/frontend engineer,
**I need** Supabase session persistence across page refreshes and browser tabs, middleware-based route protection, and a working sign-out flow,
**So that** authenticated students stay logged in without interruption.

**Covers:** S1-F-07

### Session Architecture

Supabase Auth uses `@supabase/ssr` to store the session in HTTP-only cookies. Session is refreshed automatically by middleware on every request.

```typescript
// middleware.ts
// Responsibilities:
// 1. Call supabase.auth.getUser() to validate session cookie
// 2. Refresh session token if near expiry
// 3. Redirect unauthenticated users from protected routes to /signin?redirect=<originalPath>
// 4. Redirect authenticated users away from /signin and /signup to /dashboard
// 5. Allow PUBLIC_PATHS without auth check
// 6. REDIRECT PARAM VALIDATION GUARD:
//    After successful re-auth, before following redirect param:
//    → fetch student.onboarding_completed
//    → if redirect targets /onboarding/* AND onboarding_completed = true
//    → override redirect to /dashboard
//    This prevents a stale redirect loop for students who complete onboarding
//    in a different session.

const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/legal',
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];
```

### Sign-Out Flow

```typescript
// app/api/auth/signout/route.ts — POST
// 1. supabase.auth.signOut() server-side
// 2. Clear session cookie
// 3. Redirect to /signin

// app/components/SignOutButton.tsx — client component
// POST /api/auth/signout → router.push('/signin')
```

### Acceptance Criteria

```gherkin
Scenario: Session persists after browser refresh
  Given a student is signed in
  When they refresh the browser
  Then they remain signed in
  And the dashboard loads correctly

Scenario: Sign-out clears session and redirects
  Given a signed-in student who clicks Sign Out
  When POST /api/auth/signout is called
  Then the session cookie is cleared
  And the student is redirected to /signin
  And navigating to /dashboard redirects back to /signin

Scenario: Expired session redirects with message
  Given a student whose session has expired
  When they navigate to /dashboard
  Then they are redirected to /signin?redirect=%2Fdashboard
  And the signin page shows "Your session has expired. Please sign in again."
  And after signing in they are redirected to /dashboard

Scenario: Redirect guard prevents onboarding loop
  Given a student with onboarding_completed = true whose session expired on /onboarding/subjects
  When they sign in again
  Then the redirect param /onboarding/subjects is detected
  And they are redirected to /dashboard instead
  And they are NOT sent to /onboarding/subjects

Scenario: Public paths are accessible without auth
  Given an unauthenticated user
  When they navigate to /signin, /signup, /legal/privacy-policy, or /forgot-password
  Then the page loads without redirect

Scenario: Authenticated user is redirected away from /signin and /signup
  Given a signed-in student
  When they navigate directly to /signin or /signup
  Then they are redirected to /dashboard
```

### Implementation Notes
- Use `@supabase/ssr` — NOT `@supabase/auth-helpers-nextjs` (deprecated)
- Create `lib/supabase/server.ts` and `lib/supabase/client.ts`
- The `redirect` query param must be URL-encoded
- Sign-out must be server-side — never call `supabase.auth.signOut()` from a client component directly

---

## T1.10 — Student Dashboard Shell

> **Gap Fix — Session 4 (2026-04-26):** NavBar placement clarified. NavBar must be rendered inside a `(protected)` route group layout, NOT the root `app/layout.tsx`. This prevents NavBar from rendering on unauthenticated pages (/signin, /signup, etc.). See architecture note below.

**As a** frontend engineer,
**I need** the `/dashboard` page to display the student's enrolled AP subjects, a welcome message, and a persistent navigation bar,
**So that** students have a functional home base after completing onboarding.

**Covers:** S1-F-06

### Route Group Architecture

```
app/
  (public)/                     ← unauthenticated pages — NO NavBar
    signin/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    verify-email/page.tsx
  (protected)/                  ← authenticated pages — NavBar rendered here
    layout.tsx                  ← renders NavBar + checks session
    dashboard/
      page.tsx
      loading.tsx
    onboarding/
      subjects/page.tsx
      consent/page.tsx          ← see T1.12
      awaiting-consent/page.tsx ← see T1.12
      complete-profile/page.tsx ← OAuth only, see T1.4b
    profile/
      page.tsx                  ← Sprint 2+
  legal/
    privacy-policy/page.tsx     ← no auth required
    terms-of-service/page.tsx   ← no auth required
  auth/
    consent-expired/page.tsx        ← see T1.12
    consent-already-actioned/page.tsx ← see T1.12
  components/
    nav/NavBar.tsx
    dashboard/
      SubjectCard.tsx
      EmptySubjects.tsx
```

### (protected)/layout.tsx Specification

```typescript
// app/(protected)/layout.tsx — server component
// 1. Get session via supabase server client
// 2. If no session → redirect to /signin (middleware should handle this first, but double-check)
// 3. Render NavBar + {children}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  return (
    <div>
      <NavBar />
      <main>{children}</main>
    </div>
  );
}
```

### Data Fetching

```typescript
// app/(protected)/dashboard/page.tsx — server component
// 1. Fetch students row: id, first_name, account_status, onboarding_completed
// 2. If onboarding_completed = false → redirect to /onboarding/subjects
// 3. Fetch student_subjects rows
// 4. Render dashboard
```

### NavBar Specification

```
NavBar (visible on ALL (protected) pages):
  Links: Dashboard → /dashboard
         Practice  → /practice  (disabled Sprint 1, "Coming soon" tooltip)
         FRQ       → /frq       (disabled Sprint 1, "Coming soon" tooltip)
         Profile   → /profile   (disabled Sprint 1, "Coming soon" tooltip)
  Also:  AceOS logo (top-left) | Sign Out button
  Behaviour: active link highlighted | mobile: bottom tab bar or hamburger
```

### Acceptance Criteria

```gherkin
Scenario: NavBar does NOT appear on unauthenticated pages
  Given an unauthenticated user on /signin, /signup, or /forgot-password
  Then the NavBar component is not rendered
  And no navigation links are visible

Scenario: NavBar appears on all (protected) pages
  Given a signed-in student on /dashboard
  Then the NavBar is visible
  Given the same student navigates to /onboarding/subjects
  Then the NavBar is still visible

Scenario: Dashboard shows correct enrolled subjects
  Given a student who selected AP Chemistry and AP US History
  When they reach /dashboard
  Then exactly 2 subject cards are displayed
  And each shows subject name and "Diagnostic not yet taken"
  And the Start Diagnostic button is disabled with "Coming soon"

Scenario: Welcome message uses student first name
  Given a student with first_name = "Maria"
  When the dashboard loads
  Then the page contains "Welcome back, Maria" or "Hi, Maria"

Scenario: Incomplete onboarding redirects to subject selection
  Given a student with onboarding_completed = false
  When they navigate to /dashboard
  Then they are redirected to /onboarding/subjects

Scenario: Empty subjects edge case is handled
  Given onboarding_completed = true but 0 rows in student_subjects
  When the dashboard loads
  Then EmptySubjects component renders with "Add an AP subject to get started"

Scenario: Dashboard data is fetched server-side
  When inspecting the page HTML before client JS executes
  Then subject names and welcome message are in the initial HTML
```

### Implementation Notes
- `(protected)/layout.tsx` is the ONLY place NavBar is imported. Never import NavBar inside individual page files.
- `NavBar.tsx` must be a client component (needs `usePathname` for active link)
- Dashboard page must be a server component
- Loading skeleton must match final layout to prevent layout shift

---

## T1.11 — Account Recovery (Forgot Password)

**As a** backend/frontend engineer,
**I need** a complete forgot password and password reset flow,
**So that** students can regain access without contacting support.

**Covers:** S1-F-10 (P1 — implement if time permits after P0 stories are done)

### Page & Route Map

```
app/
  (public)/
    forgot-password/page.tsx    — email input form
    reset-password/page.tsx     — new password form (client component — needs URL hash)
  api/auth/
    forgot-password/route.ts   — POST: triggers Supabase resetPasswordForEmail
    reset-password/route.ts    — POST: calls supabase.auth.updateUser
```

### Zod Schema

```typescript
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ['confirmPassword'] }
);
```

### Acceptance Criteria

```gherkin
Scenario: Reset email sent without revealing account existence
  Given any email submitted to POST /api/auth/forgot-password
  Then HTTP 200 always
  And body always { message: "If an account exists, we've sent a reset link" }

Scenario: Password must meet strength requirements
  Given invalid password submissions (too short, no uppercase, no number)
  Then specific inline error per failed rule
  And supabase.auth.updateUser is NOT called

Scenario: Successful reset redirects to signin with banner
  Given valid new password submitted
  Then redirect to /signin
  And banner: "Password updated. Please sign in."

Scenario: /forgot-password link is on signin page
  Given /signin page
  Then "Forgot password?" link is visible and navigates to /forgot-password
```

### Implementation Notes
- Reset email sent by Supabase natively — no Resend call for this flow
- `/reset-password` must be a client component (URL hash not available server-side)
- After successful password update, call `supabase.auth.signOut()` before redirecting to `/signin`

---

## T1.12 — Onboarding Flow UI Pages ⚡ NEW

> **Added Session 4 (2026-04-26):** Gap identified in agent review. The API routes for the consent flow (T1.4) redirect to several onboarding/auth pages that were never specced as UI stories. These pages are all required before S1-F-03 and S1-F-04 can be marked done.

**As a** frontend engineer,
**I need** all onboarding and consent-state UI pages to be built,
**So that** every state in the auth flow has a real screen and no route returns 404.

**Covers:** S1-F-03, S1-F-04 (UI layer only — API logic is in T1.4)

### Pages Required

| Route | Rendered In | Description |
|---|---|---|
| `/onboarding/consent` | `(protected)` | Minor student enters parent email. Form + submit. |
| `/onboarding/awaiting-consent` | `(protected)` | Holding screen — "We've emailed your parent. Waiting for approval." Resend button. |
| `/verify-email` | `(public)` | "Check your inbox" holding screen. Resend verification email button. |
| `/auth/consent-expired` | `(public)` | Shown to parent when consent token is expired. Static info page. |
| `/auth/consent-already-actioned` | `(public)` | Shown to parent when token was already used. Static info page. |

### Page Specifications

#### `/onboarding/consent` — Parent Email Form

```typescript
// Client component (needs form state)
// Fields:
//   parent_email: email input, required, Zod validated
// On submit: POST /api/auth/consent/send
// Success: redirect to /onboarding/awaiting-consent
// Error states:
//   - Invalid email format → inline: "Please enter a valid email address"
//   - API error           → inline: "Something went wrong. Please try again."
// Copy:
//   Heading: "One more step"
//   Body: "Because you're under 18, a parent or guardian needs to approve your account.
//          Enter their email below and we'll send them a quick approval request."
//   Submit button: "Send Approval Request"
```

#### `/onboarding/awaiting-consent` — Holding Screen

```typescript
// Server component
// Fetch student row: get parent_email to display masked version (e.g. j***@gmail.com)
// Copy:
//   Heading: "Waiting for approval"
//   Body: "We sent an approval request to [masked parent email].
//          Once your parent approves, you'll be able to access AceOS."
//   Resend button: POST /api/auth/consent/send → re-sends email, shows success toast
//   "Wrong email?" link: navigates back to /onboarding/consent
// Redirect guard: if student.account_status = 'active' → redirect to /onboarding/subjects
```

#### `/verify-email` — Email Verification Holding Screen

```typescript
// Client component (needs resend button interactivity)
// Copy:
//   Heading: "Check your inbox"
//   Body: "We sent a verification link to [masked student email].
//          Click the link in the email to continue."
//   Resend button: calls supabase.auth.resend({ type: 'signup', email })
//   Shows cooldown: button disabled for 60 seconds after resend
// Redirect guard: if supabase.auth.onAuthStateChange fires with 'SIGNED_IN'
//   → redirect to /onboarding/subjects (if account_status = 'active')
```

#### `/auth/consent-expired` — Expired Token (Static)

```
Heading: "This approval link has expired"
Body: "Approval links are valid for 7 days.
       [Student First Name] can log in and request a new one."
CTA link: → /signin
```

#### `/auth/consent-already-actioned` — Already Used Token (Static)

```
Heading: "This link has already been used"
Body: "You've already responded to this approval request.
       If you have questions, contact us at support@aceos.app"
CTA link: → /signin
```

### Acceptance Criteria

```gherkin
Scenario: Minor student submits parent email and is held on awaiting screen
  Given a minor student on /onboarding/consent
  When they submit a valid parent email
  Then POST /api/auth/consent/send is called
  And they are redirected to /onboarding/awaiting-consent
  And the awaiting screen shows a masked version of the parent email

Scenario: Invalid parent email shows inline error
  Given a minor student on /onboarding/consent
  When they submit "notanemail"
  Then "Please enter a valid email address" is shown inline
  And the API is NOT called

Scenario: Resend button on awaiting-consent re-sends email
  Given a student on /onboarding/awaiting-consent
  When they click "Resend"
  Then POST /api/auth/consent/send is called again
  And a success toast: "Approval request resent" is shown

Scenario: Student approved by parent is redirected from awaiting screen
  Given a student on /onboarding/awaiting-consent
  And their parent has approved (account_status = 'active')
  When the page checks account_status
  Then the student is redirected to /onboarding/subjects

Scenario: verify-email resend respects 60-second cooldown
  Given a student on /verify-email who clicks Resend
  Then the Resend button is disabled for 60 seconds
  And a countdown timer is shown

Scenario: Expired consent link shows correct screen
  Given a parent clicks an expired consent link
  When they are redirected to /auth/consent-expired
  Then the page shows "This approval link has expired"
  And a link to /signin is present

Scenario: Already-actioned consent link shows correct screen
  Given a parent clicks a consent link that was already used
  When they are redirected to /auth/consent-already-actioned
  Then the page shows "This link has already been used"
```

### Implementation Notes
- `/onboarding/consent` and `/onboarding/awaiting-consent` are inside `(protected)` route group — NavBar is visible
- `/verify-email`, `/auth/consent-expired`, `/auth/consent-already-actioned` are public — no NavBar
- The awaiting-consent page polls or uses `supabase.auth.onAuthStateChange` to detect when approval comes through — polling every 30s is acceptable for Sprint 1
- Email masking: show first character + `***` + `@domain.com` — implement as a pure utility function in `lib/utils/mask-email.ts`

---

*Sprint 1 Technical Stories | Epic 1: Foundation & Legal | AceOS v1.0*
*Last updated: 2026-04-26 (Session 4) — Gap fixes: T1.1 mastery_data, T1.4 doc_version, T1.4b Google OAuth stub, T1.5 max-4 fix, T1.9 redirect guard, T1.10 protected layout, T1.12 new onboarding UI pages.*
*Test-Forward: Write Gherkin → Build automation suite → Implement → Verify*
