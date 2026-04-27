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

**As a** backend engineer,
**I need** the Supabase project configured with the correct database schema, RLS policies, and auth settings,
**So that** all subsequent features have a secure, consistent data foundation.

### Scope
- Supabase project exists (production: `olybgkhggqnmrfcjjojy`, region `us-west-1`)
- Initial migration creates all Phase 1 tables as documented below
- Row Level Security (RLS) enabled on every table
- Supabase Auth configured for email/password (Google OAuth is S1-F-02, not yet enabled)

### Database Schema — Actual Implementation

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
  document_version TEXT,
  actor_email TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_subjects (created during onboarding — Sprint 1 S1-F-05)
CREATE TABLE student_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  exam_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
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
    | column           | value                        |
    | id               | matches auth.users uid       |
    | email            | submitted email              |
    | first_name       | "Maria"                      |
    | last_name        | "Chen"                       |
    | dob              | 2000-01-15                   |
    | account_status   | "active" (adult) or "pending_age_check" (minor) |
    | email_verified   | false                        |
    | onboarding_completed | false                    |

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
```

### Implementation Notes
- `students` record is inserted manually in `app/api/auth/signup/route.ts` using the service role client
- No DB trigger exists for student creation — this is intentional (see T1.7)
- `updated_at` is managed at the application layer, not via trigger
- All migrations must be version-controlled under `supabase/migrations/`
- Migration file naming: `YYYYMMDDHHMMSS_description.sql`
- Staging and production must be separate Supabase projects — never share a database

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

> **Updated 2026-04-26:** State machine corrected to use `students` table and actual `account_status` values. Consent token expiry corrected to 7 days (matching S1-F-09). Email provider is Resend (RESEND_API_KEY set in Vercel). Added scenarios for S1-F-04 (email verification), S1-F-07 (session expiry), and S1-F-10 (password reset).

**As a** backend engineer,
**I need** email/password authentication with an age-gate flow, email verification, parental consent email delivery, and password recovery,
**So that** the app is FERPA-compliant and fully functional for auth before Sprint 2.

**Covers:** S1-F-01, S1-F-03, S1-F-04, S1-F-09, S1-F-10
**Does NOT cover:** S1-F-02 (Google OAuth — separate story T1.4b, Sprint 1 not started), S1-F-07 (session persistence — T1.9)

### Auth Flow State Machine

```
[POST /api/auth/signup]
    → validate fields (Zod schema)
    → supabase.auth.admin.createUser()
    → insert students row (service role)
    → insert consent_log rows: 'tos_accepted', 'privacy_policy_accepted'
    → compute age from dob
    → if age >= 18:
        → update students.account_status = 'active'
        → insert consent_log: 'age_verified_adult'
        → supabase.auth.admin.generateLink({ type: 'signup' })  ← verification link generated, NOT sent yet (Resend not wired — S1-F-04)
        → redirect to /verify-email
    → if age < 18:
        → update students.account_status = 'pending_age_check'
        → redirect to /onboarding/consent  ← student enters parent email here
    → on any failure: rollback (delete auth user if students insert fails)

[POST /api/auth/consent/send]
    → validate parent_email
    → generate signed JWT: { student_id, parent_email, exp: now + 7 days }
    → send consent email via Resend to parent_email
    → update students.account_status = 'pending_consent'
    → insert consent_log: 'consent_email_sent'

[GET /api/auth/consent/approve?token=X]
    → verify JWT signature + expiry
    → if expired → redirect to /auth/consent-expired
    → if already actioned → redirect to /auth/consent-already-actioned
    → update students.account_status = 'active'
    → insert consent_log: 'consent_granted'
    → send confirmation email to student via Resend

[GET /api/auth/consent/deny?token=X]
    → verify JWT signature + expiry
    → update students.account_status = 'declined'
    → insert consent_log: 'consent_denied'
    → delete auth.users record (FERPA — no data retained without consent)

[POST /api/auth/verify-email]
    → Supabase handles OTP/link verification natively
    → on verified: update students.email_verified = true
    → redirect: if account_status = 'active' → /onboarding/subjects
               if account_status = 'pending_age_check' → /onboarding/consent
               if account_status = 'pending_consent' → /onboarding/awaiting-consent

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
// Payload
interface ConsentTokenPayload {
  student_id: string;   // UUID
  parent_email: string;
  iat: number;          // issued at (Unix seconds)
  exp: number;          // iat + 7 * 24 * 60 * 60
}

// Signing
// Algorithm: HS256
// Secret: SUPABASE_SERVICE_ROLE_KEY (server-side only, never exposed)
// Library: jose (already in Next.js ecosystem)
```

### API Route File Map

```
app/api/auth/signup/route.ts           — POST signup handler
app/api/auth/signin/route.ts           — POST signin handler
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
  And consent_log contains 'tos_accepted', 'privacy_policy_accepted', 'age_verified_adult'
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
- Consent JWT signed with `jose` library using `SUPABASE_SERVICE_ROLE_KEY` as HS256 secret
- Never use anon key to sign tokens
- All Resend calls must be server-side only (API routes) — never call Resend from client components
- Password reset uses Supabase's native `resetPasswordForEmail` — do not implement custom token logic
- The delete-on-deny operation must use service role client, never anon client

---

## T1.5 — Subject Selection Screen Implementation

**As a** frontend engineer,
**I need** the subject selection screen to display the 6 Phase 1 AP subjects and persist selections to the database,
**So that** the student's study environment is initialized correctly.

**Covers:** S1-F-05

### Subject Registry (Phase 1)

```typescript
// config/subjects.ts
export const PHASE_1_SUBJECTS = [
  { code: 'AP_CHEM',        name: 'AP Chemistry',                        type: 'VISUAL', units: 9,  exam_date_2026: '2026-05-04', icon: '🧪' },
  { code: 'AP_BIO',         name: 'AP Biology',                          type: 'VISUAL', units: 8,  exam_date_2026: '2026-05-08', icon: '🧬' },
  { code: 'AP_CALC_AB',     name: 'AP Calculus AB',                      type: 'VISUAL', units: 10, exam_date_2026: '2026-05-04', icon: '∫'  },
  { code: 'AP_USHISTORY',   name: 'AP US History',                       type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-07', icon: '🇺🇸' },
  { code: 'AP_WORLDHISTORY',name: 'AP World History',                    type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-14', icon: '🌍' },
  { code: 'AP_LANG',        name: 'AP English Language & Composition',   type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-13', icon: '✍️' },
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
  // 1. Validate: min 1, max 4 subjects (functional spec cap is 4, not 6)
  // 2. Upsert student_subjects records
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

Scenario: Subject rows created in database
  Given a student selects AP Chemistry and AP US History and clicks Continue
  Then 2 rows exist in student_subjects with correct student_id and subject_code values
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

> **Decision made 2026-04-26:** This story is superseded. The DB trigger approach was not implemented. Instead, the `students` row is created manually in the signup API route (`app/api/auth/signup/route.ts`) using the service role client. This is intentional — the manual insert approach is simpler, fully testable in unit tests without mocking Postgres triggers, and easier to roll back on failure.
>
> **Kept for audit trail only. Do not implement.**
>
> If a trigger is ever added in future, the API route insert must be removed first to prevent double-insert. The `ON CONFLICT DO NOTHING` clause in the old trigger spec would have silently masked this bug.

---

## T1.8 — Error Boundary & Graceful Degradation

**As a** frontend engineer,
**I need** React error boundaries and structured error states on all auth and onboarding pages,
**So that** a user never sees a raw error or blank screen if any service fails.

**Covers:** Applies cross-cutting to S1-F-01, S1-F-03, S1-F-04, S1-F-05, S1-F-06, S1-F-07, S1-F-10

### Error State Specification

```typescript
// components/ErrorBoundary.tsx
// Class component — catches unhandled render errors
// Props: children, fallback (optional custom fallback UI)
// On error: shows "Something went wrong" message + "Reload page" button
// Reports to console.error (Sentry integration Sprint 2+)

// Standardised error response shape from all API routes:
interface ApiError {
  error: string;        // machine-readable error code e.g. 'EMAIL_ALREADY_EXISTS'
  message: string;      // human-readable message safe to display
  status: number;       // HTTP status code
}

// Error messages by scenario:
// Network offline      → "You're offline. Check your connection and try again."
// Auth failure         → "Sign in failed. Please try again."
// Server action error  → "Something went wrong. Your data has not been saved."
// Timeout              → "This is taking longer than expected. Please try again."
// Duplicate email      → "An account with this email already exists. Sign in instead?"
```

### Acceptance Criteria

```gherkin
Scenario: Auth failure shows user-friendly message
  Given Supabase returns a 500 error during sign-in
  When the user submits the sign-in form
  Then "Sign in failed. Please try again." is displayed
  And the raw Supabase error is never shown to the user

Scenario: Offline state is communicated
  Given the user's device is offline
  When they submit the signup form
  Then "You're offline. Check your connection and try again." is shown
  And the form fields retain their current values

Scenario: Error boundary catches render crash
  Given any child component throws an unhandled error during render
  When the error boundary catches it
  Then a fallback UI is shown with a "Reload page" button
  And no blank/white screen is shown

Scenario: Loading states prevent double-submit
  Given a user submits the signup form
  When the server action is in flight
  Then the submit button is disabled and shows a loading spinner
  And a second click on the button has no effect

Scenario: API error codes are machine-readable
  Given any API route returns an error
  Then the response body shape is { error: string, message: string, status: number }
  And the error field is a SCREAMING_SNAKE_CASE code
  And the message field is safe to display directly in the UI
```

---

## T1.9 — Session Management & Sign-Out

**As a** backend/frontend engineer,
**I need** Supabase session persistence across page refreshes and browser tabs, middleware-based route protection, and a working sign-out flow,
**So that** authenticated students stay logged in without interruption and unauthenticated users are always redirected to sign-in.

**Covers:** S1-F-07

### Session Architecture

Supabase Auth uses `@supabase/ssr` to store the session in HTTP-only cookies. The session cookie is set server-side on signin and refreshed automatically by middleware on every request.

```typescript
// middleware.ts — runs on every request
// Responsibilities:
// 1. Call supabase.auth.getUser() to validate the session cookie
// 2. Refresh the session token if it's within the refresh window
// 3. Redirect unauthenticated users from protected routes to /signin?redirect=<originalPath>
// 4. Redirect authenticated users away from /signin and /signup to /dashboard
// 5. Allow all PUBLIC_PATHS without auth check

const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/legal',
  '/auth',       // covers /auth/consent-expired, /auth/consent-already-actioned
  '/api/auth',   // covers all /api/auth/* routes
  '/_next',
  '/favicon.ico',
];
```

### Sign-Out Flow

```typescript
// app/api/auth/signout/route.ts  — POST
// 1. Call supabase.auth.signOut() server-side
// 2. Clear session cookie
// 3. Return redirect to /signin

// app/components/SignOutButton.tsx — client component
// Calls POST /api/auth/signout on click
// Shows loading state during request
// On response: router.push('/signin')
```

### Expired Session Handling

```typescript
// middleware.ts
// If getUser() returns null on a protected route:
//   → redirect to /signin?redirect=<encodedOriginalPath>
//
// app/signin/page.tsx
// On mount: if searchParams.redirect exists → show banner
//   "Your session has expired. Please sign in again."
// After successful signin: router.push(redirect) or '/dashboard'
```

### Acceptance Criteria

```gherkin
Scenario: Session persists after browser refresh
  Given a student is signed in
  When they refresh the browser
  Then they remain signed in
  And the dashboard loads correctly without redirecting to /signin

Scenario: Session persists across tabs
  Given a student is signed in on one tab
  When they open a new tab and navigate to https://aceos-ai.vercel.app/dashboard
  Then they are automatically signed in
  And the dashboard loads without re-authentication

Scenario: Sign-out clears session and redirects
  Given a signed-in student who clicks Sign Out
  When POST /api/auth/signout is called
  Then the session cookie is cleared
  And the student is redirected to /signin
  And navigating to /dashboard redirects back to /signin

Scenario: Expired session redirects with message
  Given a student whose session token has expired
  When they navigate to /dashboard
  Then they are redirected to /signin?redirect=%2Fdashboard
  And the signin page shows "Your session has expired. Please sign in again."
  And after signing in successfully they are redirected to /dashboard

Scenario: Unauthenticated user is blocked from protected routes
  Given an unauthenticated user
  When they navigate to /dashboard, /onboarding/subjects, or /profile
  Then they are redirected to /signin
  And the redirect param preserves the original path

Scenario: Public paths are accessible without auth
  Given an unauthenticated user
  When they navigate to /signin, /signup, /legal/privacy-policy, or /forgot-password
  Then the page loads without redirect

Scenario: Authenticated user is redirected away from /signin and /signup
  Given a signed-in student
  When they navigate directly to /signin or /signup
  Then they are redirected to /dashboard

Scenario: Middleware refreshes session token transparently
  Given a student with a session token near expiry
  When they make any request to the app
  Then the middleware refreshes the token
  And no sign-in prompt is shown to the student
```

### Implementation Notes
- Use `@supabase/ssr` package — NOT `@supabase/auth-helpers-nextjs` (deprecated)
- Create two Supabase client helpers: `lib/supabase/server.ts` (server components + API routes) and `lib/supabase/client.ts` (client components)
- Session cookie must be HTTP-only and Secure in production
- The `redirect` query param must be URL-encoded before appending
- Sign-out must be server-side (API route) — never call `supabase.auth.signOut()` from a client component directly as it doesn't clear the server cookie

---

## T1.10 — Student Dashboard Shell

**As a** frontend engineer,
**I need** the `/dashboard` page to display the student's enrolled AP subjects, a welcome message, and a persistent navigation bar,
**So that** students have a functional home base after completing onboarding.

**Covers:** S1-F-06

### Page Architecture

```
app/
  dashboard/
    page.tsx           — server component, fetches student + subject data
    loading.tsx        — skeleton loading state
  components/
    nav/
      NavBar.tsx       — persistent nav, client component
    dashboard/
      SubjectCard.tsx  — displays one enrolled subject
      EmptySubjects.tsx — empty state when no subjects enrolled
```

### Data Fetching

```typescript
// app/dashboard/page.tsx — server component
// 1. Get session via supabase server client → if null, middleware handles redirect
// 2. Fetch students row: id, first_name, account_status, onboarding_completed
// 3. If onboarding_completed = false → redirect to /onboarding/subjects
// 4. Fetch student_subjects rows for this student
// 5. Render dashboard with student data + subject list

interface DashboardPageProps {
  student: {
    id: string;
    first_name: string;
    account_status: string;
  };
  subjects: {
    id: string;
    subject_code: string;
    subject_name: string;
    exam_date: string | null;
  }[];
}
```

### Subject Card Specification

```
SubjectCard component:
  - Subject name (e.g. "AP Chemistry")
  - Subject icon from PHASE_1_SUBJECTS config
  - Status badge: "Diagnostic not yet taken" (Sprint 1 only)
  - Exam date if set (formatted: "May 4, 2026")
  - CTA button: "Start Diagnostic" → disabled with tooltip "Coming soon" in Sprint 1
```

### Navigation Bar Specification

```
NavBar component (visible on ALL authenticated pages):
  Links:
    - Dashboard    → /dashboard
    - Practice     → /practice    (disabled in Sprint 1, "Coming soon" tooltip)
    - FRQ          → /frq         (disabled in Sprint 1, "Coming soon" tooltip)
    - Profile      → /profile     (disabled in Sprint 1, "Coming soon" tooltip)
  Also contains:
    - AceOS logo (top-left)
    - Sign Out button (bottom or top-right)
  Behaviour:
    - Active link is visually highlighted
    - Mobile: collapses to bottom tab bar or hamburger menu
```

### Acceptance Criteria

```gherkin
Scenario: Dashboard shows correct enrolled subjects
  Given a student who selected AP Chemistry and AP US History during onboarding
  When they reach /dashboard
  Then exactly 2 subject cards are displayed
  And each card shows the subject name and "Diagnostic not yet taken"
  And the Start Diagnostic button is present but disabled with "Coming soon"

Scenario: Welcome message uses student first name
  Given a student with first_name = "Maria"
  When the dashboard loads
  Then the page contains "Welcome back, Maria" or "Hi, Maria" (exact copy TBD)

Scenario: Dashboard is protected
  Given an unauthenticated user
  When they navigate to /dashboard
  Then middleware redirects them to /signin

Scenario: Navigation bar is visible on all authenticated pages
  Given a signed-in student on /dashboard
  Then the NavBar is visible with Dashboard, Practice, FRQ, and Profile links
  And the Dashboard link is in active/highlighted state

Scenario: Incomplete onboarding redirects to subject selection
  Given a student with onboarding_completed = false
  When they navigate to /dashboard
  Then they are redirected to /onboarding/subjects

Scenario: Empty subjects edge case is handled
  Given a student with onboarding_completed = true but 0 rows in student_subjects
  When the dashboard loads
  Then the EmptySubjects component is rendered
  And it shows "Add an AP subject to get started" with a link to /onboarding/subjects

Scenario: Dashboard loading skeleton is shown
  Given the dashboard data fetch is in progress
  When the page is rendering
  Then a skeleton loading state is shown (not a blank page or spinner only)

Scenario: Dashboard data is fetched server-side
  Given the dashboard page
  When inspecting the page HTML before client JS executes
  Then subject names and the welcome message are present in the initial HTML
  And no client-side fetch waterfall is required for the primary content
```

### Implementation Notes
- `dashboard/page.tsx` must be a server component — data fetching happens server-side for SEO and performance
- `NavBar.tsx` must be a client component (needs `usePathname` for active link highlighting)
- NavBar should be rendered in `app/layout.tsx` inside an auth check, not inside the dashboard page itself — so it appears on all protected pages without repeating the import
- Loading skeleton must match the final layout dimensions to prevent layout shift
- `SubjectCard` is a server component — no interactivity needed in Sprint 1

---

## T1.11 — Account Recovery (Forgot Password)

**As a** backend/frontend engineer,
**I need** a complete forgot password and password reset flow using Supabase's native reset mechanism and Resend for email delivery,
**So that** students can regain access to their account without contacting support.

**Covers:** S1-F-10

### Page & Route Map

```
app/
  forgot-password/
    page.tsx                   — email input form (unauthenticated)
  reset-password/
    page.tsx                   — new password form (accessed via magic link)
  api/
    auth/
      forgot-password/
        route.ts               — POST: triggers Supabase resetPasswordForEmail
      reset-password/
        route.ts               — POST: calls supabase.auth.updateUser({ password })
```

### Forgot Password Flow

```typescript
// POST /api/auth/forgot-password
// Input: { email: string }
// Always returns: { message: "If an account exists, we've sent a reset link" } + HTTP 200
// If email exists in auth.users:
//   → supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: `${NEXT_PUBLIC_APP_URL}/reset-password`
//     })
// Supabase sends the reset email natively — no Resend call needed here
// Reset link expires: 1 hour (Supabase default, configurable in Supabase dashboard)
```

### Password Reset Form Validation

```typescript
// Zod schema for new password
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
Scenario: Forgot password page is accessible without auth
  Given an unauthenticated user
  When they navigate to /forgot-password
  Then the page loads without redirect

Scenario: Reset email sent without revealing account existence
  Given any email submitted to POST /api/auth/forgot-password
  Then the response is always HTTP 200
  And the body is always { message: "If an account exists, we've sent a reset link" }
  And no information is revealed about whether the account exists

Scenario: Valid email triggers Supabase reset email
  Given a registered email address
  When POST /api/auth/forgot-password is called
  Then supabase.auth.resetPasswordForEmail is called with that email
  And the redirectTo param is set to NEXT_PUBLIC_APP_URL + "/reset-password"

Scenario: Reset link expires after 1 hour
  Given a password reset link more than 1 hour old
  When the student clicks it
  Then they see: "This reset link has expired. Please request a new one."
  And a link to /forgot-password is shown

Scenario: Password must meet strength requirements
  Given a student on /reset-password
  When they submit a password that is 6 characters long
  Then "Password must be at least 8 characters" is shown inline
  And supabase.auth.updateUser is NOT called

  When they submit a password with no uppercase letter
  Then "Password must contain at least one uppercase letter" is shown inline

  When they submit a password with no number
  Then "Password must contain at least one number" is shown inline

Scenario: Passwords must match
  Given a student enters password "Secure1!" and confirm password "Different1!"
  When they submit
  Then "Passwords don't match" is shown on the confirm password field
  And supabase.auth.updateUser is NOT called

Scenario: Successful reset redirects to signin with banner
  Given a student submits a valid new password
  When POST /api/auth/reset-password succeeds
  Then they are redirected to /signin
  And the signin page shows a success banner: "Password updated. Please sign in."

Scenario: /forgot-password link is present on signin page
  Given an unauthenticated user on /signin
  Then a "Forgot password?" link is visible
  And clicking it navigates to /forgot-password
```

### Implementation Notes
- Password reset email is sent by Supabase natively — do NOT wire Resend for this flow
- The reset session (magic link token) is handled by Supabase client SDK on the `/reset-password` page — call `supabase.auth.getSession()` on mount to extract the token from the URL hash before calling `updateUser`
- `/reset-password` page must be a client component (needs access to URL hash fragment, which is not available server-side)
- After successful password update, call `supabase.auth.signOut()` before redirecting to `/signin` to clear any stale session state

---

*Sprint 1 Technical Stories | Epic 1: Foundation & Legal | AceOS v1.0*
*Last updated: 2026-04-26 (Session 3) — Schema drift resolved. T1.7 superseded. T1.9, T1.10, T1.11 added.*
*Test-Forward: Write Gherkin → Build automation suite → Implement → Verify*
