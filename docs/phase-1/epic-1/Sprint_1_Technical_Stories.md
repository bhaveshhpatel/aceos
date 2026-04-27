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
> Original spec used a `profiles` table. Actual implementation uses a `students` table with manual insertion in the API route. This story has been updated to reflect the implemented schema. The `profiles` table, `is_minor` computed column, and DB trigger (T1.7) are superseded.

> **Gap Fix — Session 4 (2026-04-26):** Added `mastery_data JSONB` column to `student_subjects`.

> **Gap Fix — Session 5 (2026-04-26):** Added `parent_email TEXT` column to `students` table (G6). Added index on `consent_log.student_id` (G8).

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
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  account_status TEXT NOT NULL CHECK (
    account_status IN ('pending_age_check', 'pending_consent', 'active', 'declined', 'suspended')
  ) DEFAULT 'pending_age_check',
  -- parent_email: stored on the student row when a minor submits /onboarding/consent.
  -- Required for: resend flow, audit trail, awaiting-consent masking display.
  -- NULL for adult accounts.
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
  -- document_version: '1.0' for tos_accepted and privacy_policy_accepted. NULL for all others.
  document_version TEXT,
  actor_email TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance index: consent_log is queried by student_id on every auth operation.
CREATE INDEX idx_consent_log_student_id ON consent_log(student_id);

-- student_subjects (created during onboarding — Sprint 1 S1-F-05)
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

-- provider_config (PID model — Sprint 2+)
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

Scenario: Service role can write to consent_log
  Given a server-side Supabase client using service_role key
  When it inserts a consent_log record
  Then the insert succeeds

Scenario: Client cannot read consent_log
  Given an authenticated student JWT
  When the client queries consent_log
  Then zero rows are returned

Scenario: students row shape is correct after signup
  Given a successful email signup for student "Maria Chen", dob 2000-01-15
  Then a students row exists with id, email, first_name, last_name, dob,
       account_status, email_verified = false, onboarding_completed = false
  And parent_email IS NULL (adult)

Scenario: parent_email is stored on minor student row
  Given a minor student who submits /onboarding/consent with parent email "parent@example.com"
  When POST /api/auth/consent/send is called
  Then students.parent_email = 'parent@example.com'

Scenario: account_status CHECK constraint rejects invalid values
  Given a students row
  When updated to account_status = 'unknown'
  Then the update is rejected by the CHECK constraint

Scenario: consent_log event_type constraint is enforced
  Given a service_role client
  When it inserts a consent_log row with event_type = 'invalid_event'
  Then the insert is rejected

Scenario: consent_log document_version is written correctly
  Given a successful adult signup
  Then tos_accepted row has document_version = '1.0'
  And privacy_policy_accepted row has document_version = '1.0'
  And age_verified_adult row has document_version = NULL

Scenario: mastery_data initializes as empty object
  Given a student selects AP Chemistry
  When the student_subjects row is created
  Then mastery_data = '{}'

Scenario: consent_log student_id index exists
  Given the database schema is applied
  When pg_indexes is queried for consent_log
  Then idx_consent_log_student_id exists on the student_id column
```

### Implementation Notes
- `students` record inserted manually in `app/api/auth/signup/route.ts` using service role client
- `parent_email` is written by `POST /api/auth/consent/send`, not at signup time
- `updated_at` managed at application layer
- All migrations version-controlled under `supabase/migrations/`
- `document_version` must be passed explicitly as `"1.0"` — NOT a DB default

---

## T1.2 — Vercel Deployment Pipeline

**As a** DevOps engineer,
**I need** a CI/CD pipeline deploying the Next.js app to Vercel on every push to `main`,
**So that** the team can ship to production with confidence after tests pass.

> **Implementation Note:** Pipeline uses Vercel CLI API approach. Files: `.github/workflows/test.yml`, `preview.yml`, `deploy.yml`.

### Environment Variable Schema

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CONSENT_JWT_SECRET=          # separate secret for signing consent JWTs — NOT service role key
NEXT_PUBLIC_APP_URL=          # must include https:// prefix
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
OPENAI_API_KEY=               # Sprint 2+
GROQ_API_KEY=                 # Sprint 2+
```

### Acceptance Criteria

```gherkin
Scenario: Push to main triggers production deployment
  Given a commit is pushed to main
  When CI tests pass
  Then production deployment completes within 5 minutes

Scenario: Failed tests block deployment
  Given a push with a failing test
  Then the deploy job does not execute

Scenario: Server-only env vars not in client bundle
  Given the production build
  Then SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CONSENT_JWT_SECRET are not in the JS bundle

Scenario: NEXT_PUBLIC_APP_URL includes https:// prefix
  Given the env var is set correctly
  When new URL(process.env.NEXT_PUBLIC_APP_URL) is called
  Then no TypeError is thrown
```

---

## T1.3 — LiteLLM Gateway Configuration

> Sprint 2+. Not yet started.

**As a** backend engineer,
**I need** LiteLLM deployed as an AI gateway with model routing via `model_map.json`,
**So that** any AI model can be swapped via config change with no application code changes.

### model_map.json Specification

```json
{
  "routes": {
    "grading_text": { "primary": "gpt-4o", "fallback": "gpt-4o-mini", "timeout_seconds": 30, "max_tokens": 4096 },
    "grading_stem": { "primary": "gpt-4o", "fallback": "gpt-4o-mini", "timeout_seconds": 45, "max_tokens": 4096, "supports_vision": true },
    "tutor_response": { "primary": "groq/llama-3.1-70b-versatile", "fallback": "gpt-4o-mini", "timeout_seconds": 10, "max_tokens": 1024 },
    "diagnostic_explanation": { "primary": "groq/llama-3.1-70b-versatile", "fallback": "gpt-4o-mini", "timeout_seconds": 10, "max_tokens": 512 },
    "score_prediction": { "primary": "gpt-4o-mini", "fallback": "groq/llama-3.1-70b-versatile", "timeout_seconds": 15, "max_tokens": 256 }
  },
  "cost_controls": { "max_monthly_spend_usd": 500, "alert_threshold_usd": 400 }
}
```

### AI Client Abstraction Layer

```typescript
export async function callAI(params: AIRequestParams): Promise<AIResponse> {
  // Routes through LiteLLM gateway — never calls vendor SDK directly
}
```

### Acceptance Criteria

```gherkin
Scenario: Route key determines model
  Given grading_text mapped to gpt-4o
  When callAI({ route: 'grading_text' })
  Then AIResponse.model_used = 'gpt-4o'

Scenario: Fallback triggers on primary failure
  Given gpt-4o returns 503
  Then request retried with gpt-4o-mini

Scenario: Model swap requires only config change
  Given model_map.json updated (no code deploy)
  Then subsequent calls use the new model

Scenario: Timeout enforced per route
  Given grading_text timeout_seconds = 30
  When model doesn't respond in 30s
  Then TimeoutError is thrown
```

### Implementation Notes
- `callAI` is the ONLY function that calls any AI vendor — no direct SDK imports elsewhere
- All prompt templates in `lib/ai/prompts/` as versioned `.ts` files

---

## T1.4 — Authentication System Implementation

> **Updated 2026-04-26 (Session 3):** State machine corrected to use `students` table and actual `account_status` values.
> **Gap Fix — Session 4:** `consent_log.document_version` convention documented.
> **Gap Fix — Session 5 (G1, G6, G7, G9, G10):** Minor flow corrected (email verify first). `parent_email` written on consent send. Parent approval/decline routes fully specced. Middleware `declined` rule added. Race condition guard added to approval route.

**As a** backend engineer,
**I need** email/password authentication with an age-gate flow, email verification, parental consent email delivery, and password recovery,
**So that** the app is FERPA-compliant and fully functional for auth before Sprint 2.

**Covers:** S1-F-01, S1-F-03, S1-F-04, S1-F-09, S1-F-10

### Auth Flow State Machine

```
[POST /api/auth/signup]
    → validate fields (Zod)
    → supabase.auth.admin.createUser()
    → insert students row (service role)
    → insert consent_log: 'tos_accepted' { document_version: '1.0' }
    → insert consent_log: 'privacy_policy_accepted' { document_version: '1.0' }
    → compute age from dob
    → if age >= 18:
        → students.account_status = 'active'
        → insert consent_log: 'age_verified_adult' { document_version: NULL }
    → if age < 18:
        → students.account_status = 'pending_age_check'
    → ALL USERS: generate Supabase verification link → send via Resend
    → ALL USERS: redirect to /verify-email
    → on any failure: delete auth user (rollback)

[Supabase email verification callback]
    → students.email_verified = true
    → redirect based on account_status:
        'active'           → /onboarding/subjects
        'pending_age_check'→ /onboarding/consent
        'pending_consent'  → /onboarding/awaiting-consent

[POST /api/auth/consent/send]
    → authenticate request (valid session, account_status IN ('pending_age_check', 'pending_consent'))
    → validate parent_email (Zod)
    → update students.parent_email = parent_email  ← persists for resend + display
    → update students.account_status = 'pending_consent'
    → generate signed consent JWT: { student_id, parent_email, exp: now + 7d }
      signed with CONSENT_JWT_SECRET (HS256, jose)
    → insert consent_log: 'consent_email_sent' { document_version: NULL, actor_email: parent_email }
    → send consent email via Resend
    → return { success: true }

[GET /api/auth/consent/approve?token=X]  ← FULLY SPECCED (G7)
    → verify JWT: signature + expiry
    → if invalid/expired → redirect to /auth/consent-expired
    → decode: { student_id, parent_email }
    → SELECT FOR UPDATE students WHERE id = student_id  ← prevents race condition (G10)
    → if account_status = 'active' → redirect to /auth/consent-already-actioned (already approved)
    → if account_status = 'declined' → redirect to /auth/consent-already-actioned
    → update students.account_status = 'active'
    → insert consent_log: 'consent_granted' { document_version: NULL, actor_email: parent_email }
    → send confirmation email to student via Resend
    → redirect to success page: show "[Student first name]'s account is now active."

[GET /api/auth/consent/deny?token=X]  ← FULLY SPECCED (G7)
    → verify JWT: signature + expiry
    → if invalid/expired → redirect to /auth/consent-expired
    → decode: { student_id, parent_email }
    → SELECT FOR UPDATE students WHERE id = student_id
    → if account_status NOT IN ('pending_age_check', 'pending_consent') → redirect to /auth/consent-already-actioned
    → update students.account_status = 'declined'
    → insert consent_log: 'consent_denied' { document_version: NULL, actor_email: parent_email }
    → delete auth.users record (FERPA — no data retained without consent)
    → redirect to denial page: show "Account request declined."

[POST /api/auth/forgot-password]
    → always return HTTP 200 { message: "If an account exists, we've sent a reset link" }
    → if email exists: supabase.auth.resetPasswordForEmail(email, { redirectTo })

[POST /api/auth/reset-password]
    → validate password (Zod: min 8, 1 uppercase, 1 number)
    → supabase.auth.updateUser({ password })
    → redirect to /signin with success banner
```

### Consent Email Specification (via Resend)

```
From:    onboarding@resend.dev
Subject: Your approval is needed for [Student First Name]'s AceOS account

Body:
  [Student First Name] ([Student Email]) signed up for AceOS —
  an AI-powered AP exam prep platform.

  Because [Student First Name] is under 18, we need your permission
  before storing any academic data.

  [APPROVE ACCESS]  → /api/auth/consent/approve?token=JWT
  [DECLINE ACCESS]  → /api/auth/consent/deny?token=JWT

  This link expires in 7 days.
  Privacy Policy: /legal/privacy-policy
```

### Consent JWT Specification

```typescript
interface ConsentTokenPayload {
  student_id: string;
  parent_email: string;
  iat: number;
  exp: number; // iat + 7 * 24 * 60 * 60
}
// Algorithm: HS256
// Secret: CONSENT_JWT_SECRET (dedicated env var — NOT service role key)
// Library: jose
```

### API Route File Map

```
app/api/auth/signup/route.ts
app/api/auth/signin/route.ts
app/api/auth/signout/route.ts
app/api/auth/consent/send/route.ts
app/api/auth/consent/approve/route.ts   ← GET, handles approval + race guard
app/api/auth/consent/deny/route.ts      ← GET, handles denial + FERPA delete
app/api/auth/forgot-password/route.ts
app/api/auth/reset-password/route.ts
app/api/auth/verify-email/route.ts
```

### Acceptance Criteria

```gherkin
Scenario: Adult signup → /verify-email (all users)
  Given a user submits signup with dob 20 years ago
  When POST /api/auth/signup succeeds
  Then students.account_status = 'active'
  And redirect = /verify-email

Scenario: Minor signup → /verify-email (all users)
  Given a user submits signup with dob 15 years ago
  When POST /api/auth/signup succeeds
  Then students.account_status = 'pending_age_check'
  And redirect = /verify-email
  And NOT redirected to /onboarding/consent (that comes after email verification)

Scenario: Minor email verified → /onboarding/consent
  Given a minor with email_verified = false
  When they click the verification link
  Then email_verified = true
  And redirect = /onboarding/consent

Scenario: Adult email verified → /onboarding/subjects
  Given an adult with account_status = 'active' and email_verified = false
  When they click the verification link
  Then email_verified = true
  And redirect = /onboarding/subjects

Scenario: Consent send stores parent_email on student row
  Given a minor student posts valid parent_email to /api/auth/consent/send
  Then students.parent_email = submitted parent_email
  And students.account_status = 'pending_consent'
  And consent_log contains 'consent_email_sent'

Scenario: Parent approval activates account (race-safe)
  Given a valid unexpired consent JWT
  When GET /api/auth/consent/approve is called
  Then SELECT FOR UPDATE locks the students row
  And students.account_status = 'active'
  And consent_log contains 'consent_granted'
  And confirmation email sent to student

Scenario: Simultaneous approval clicks produce one outcome
  Given two concurrent requests to /api/auth/consent/approve with the same token
  When both requests are processed
  Then exactly one consent_granted row is created in consent_log
  And the second request is redirected to /auth/consent-already-actioned

Scenario: Parent denial deletes auth record (FERPA)
  Given a valid unexpired consent JWT
  When GET /api/auth/consent/deny
  Then students.account_status = 'declined'
  And auth.users record is deleted
  And consent_log contains 'consent_denied'

Scenario: Expired token redirects to consent-expired page
  Given a JWT with exp = 8 days ago
  When GET /api/auth/consent/approve
  Then redirect = /auth/consent-expired
  And students.account_status is unchanged

Scenario: Already-approved token redirects to already-actioned page
  Given students.account_status = 'active'
  When the same approval link is clicked again
  Then redirect = /auth/consent-already-actioned
  And no duplicate consent_log rows

Scenario: Signup rolls back on failure
  Given auth.admin.createUser() succeeds but students insert fails
  Then auth.users record is deleted
  And API returns 500

Scenario: Duplicate email returns 409
  Given an existing email
  When POST /api/auth/signup
  Then HTTP 409, body { error: 'EMAIL_ALREADY_EXISTS' }

Scenario: Reset email sent without revealing account existence
  Given any email to POST /api/auth/forgot-password
  Then HTTP 200, body { message: "If an account exists, we've sent a reset link" }
```

### Implementation Notes
- Consent JWT signed with `CONSENT_JWT_SECRET` — a dedicated env var, NOT `SUPABASE_SERVICE_ROLE_KEY`
- `SELECT FOR UPDATE` on approval/denial routes requires service role + raw SQL via `supabase.rpc` or `pg` direct connection
- `document_version: '1.0'` passed explicitly — not a DB default
- All Resend calls server-side only
- Password reset uses Supabase native `resetPasswordForEmail` — no custom token logic

---

## T1.4b — Google OAuth Sign-Up & Sign-In ⏸ DESCOPED TO SPRINT 2

> **Status:** Written Session 4. Descoped to Sprint 2 — requires Google Cloud OAuth project creation first.

**Covers:** S1-F-02

### Pre-Implementation Checklist

```
☐ Create Google Cloud project
☐ Enable People API
☐ OAuth consent screen: app name "AceOS", scopes: email, profile
☐ Create OAuth 2.0 Client ID → type: Web Application
☐ Authorized redirect URI: https://olybgkhggqnmrfcjjojy.supabase.co/auth/v1/callback
☐ Add Client ID + Secret to Supabase Auth → Providers → Google
☐ Add GOOGLE_CLIENT_ID to Vercel env vars
```

### OAuth Flow Architecture

```
[Client] → signInWithOAuth({ provider: 'google', redirectTo: APP_URL + '/auth/callback' })
→ Google consent screen
→ Supabase callback
→ /auth/callback route handler:
    → exchange code for session
    → if NO students row: redirect to /onboarding/complete-profile
    → if YES + onboarding_completed: redirect to /dashboard
    → if YES + !onboarding_completed: redirect to /onboarding/subjects
```

### Acceptance Criteria

```gherkin
Scenario: New Google user → complete-profile
  Given no students row for uid
  When /auth/callback is hit
  Then redirect = /onboarding/complete-profile

Scenario: Returning Google user → dashboard
  Given onboarding_completed = true
  When /auth/callback is hit
  Then redirect = /dashboard

Scenario: OAuth complete-profile follows same age gate
  Given new Google user submits dob = 15 years ago
  Then account_status = 'pending_age_check'
  And redirect = /verify-email

Scenario: Missing code param handled
  Given /auth/callback accessed without code
  Then redirect = /signin with error message
```

---

## T1.5 — Subject Selection Screen Implementation

> **Gap Fix — Session 4:** Max subjects corrected to 4 everywhere.

**Covers:** S1-F-05

### Subject Registry (Phase 1)

```typescript
export const PHASE_1_SUBJECTS = [
  { code: 'AP_CHEM',         name: 'AP Chemistry',                      type: 'VISUAL', units: 9,  exam_date_2026: '2026-05-04', icon: '🧪' },
  { code: 'AP_BIO',          name: 'AP Biology',                        type: 'VISUAL', units: 8,  exam_date_2026: '2026-05-08', icon: '🧬' },
  { code: 'AP_CALC_AB',      name: 'AP Calculus AB',                    type: 'VISUAL', units: 10, exam_date_2026: '2026-05-04', icon: '∫'  },
  { code: 'AP_USHISTORY',    name: 'AP US History',                     type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-07', icon: '🇺🇸' },
  { code: 'AP_WORLDHISTORY', name: 'AP World History',                  type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-14', icon: '🌍' },
  { code: 'AP_LANG',         name: 'AP English Language & Composition', type: 'TEXT',   units: 9,  exam_date_2026: '2026-05-13', icon: '✍️' },
] as const;
```

### Server Action

```typescript
export async function saveSubjectSelections(
  studentId: string,
  selections: { subjectCode: string; examDate: string }[]
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate: min 1, max 4
  // 2. Upsert student_subjects (mastery_data: {})
  // 3. Update students.onboarding_completed = true
  // 4. Return { success: true } or { success: false, error }
}
```

### Acceptance Criteria

```gherkin
Scenario: All 6 subjects shown
  Given authenticated student on /onboarding/subjects
  Then 6 cards displayed, all unselected

Scenario: Min 1 enforced
  Given 0 selected, click Continue
  Then "Please select at least one AP subject to continue"

Scenario: Max 4 enforced
  Given 4 selected
  When 5th attempted
  Then card does not select, message shown

Scenario: DB rows created correctly
  Given student selects AP Chemistry + AP US History, clicks Continue
  Then 2 student_subjects rows with mastery_data = '{}'
  And onboarding_completed = true
  And redirect = /dashboard

Scenario: Completed onboarding → redirect away from entire /onboarding/* namespace
  Given onboarding_completed = true
  When student navigates to /onboarding/subjects OR /onboarding/consent
  Then redirect = /dashboard
```

---

## T1.6 — Privacy Policy & Terms of Service Legal Pages

> **Gap Fix — Session 5 (G3):** Sprint 1 renders placeholder content. Real content required before public launch. Spec updated to reflect placeholder strategy.

**Covers:** S1-F-08 (UI layer)

### Sprint 1 Strategy: Placeholder Pages

Both legal pages will render placeholder content in Sprint 1 to unblock S1-F-08. The placeholder must clearly indicate the page is under construction and NOT be indexed by search engines.

```tsx
// app/legal/privacy-policy/page.tsx
// app/legal/terms-of-service/page.tsx

// Sprint 1 placeholder content:
// <head>: <meta name="robots" content="noindex" />
// Heading: "Privacy Policy" / "Terms of Service"
// Body: "We're finalizing this document. It will be published before AceOS opens to the public.
//        If you have questions, contact us at support@aceos.app"
// Last updated: [build date]

// ⚠️ PRE-LAUNCH BLOCKER: Replace placeholder with real FERPA-compliant content
// before any public or beta users are onboarded.
// Ticket must be created and assigned before Sprint 1 is marked complete.
```

### Route Requirements

| Route | Sprint 1 Content | Must Have Real Content By |
|---|---|---|
| `/legal/privacy-policy` | Placeholder (noindex) | Public launch |
| `/legal/terms-of-service` | Placeholder (noindex) | Public launch |

### Acceptance Criteria

```gherkin
Scenario: Legal pages load without auth
  Given unauthenticated user
  When they navigate to /legal/privacy-policy or /legal/terms-of-service
  Then page loads with content
  And no signin redirect

Scenario: Legal pages have noindex meta tag in Sprint 1
  Given either legal page in Sprint 1
  Then <meta name="robots" content="noindex"> is present in <head>

Scenario: Legal page links on signup form work
  Given user on /signup
  Then Privacy Policy and Terms of Service links open correct pages in new tab

Scenario: Consent email links to privacy policy
  Given a parental consent email
  Then it contains a link to /legal/privacy-policy
  And the link resolves without redirecting to /signin

Scenario: Legal pages render on mobile
  Given either legal page on 375px viewport
  Then all text readable without horizontal scroll
```

---

## T1.7 — Profile Auto-Creation Trigger ⛔ SUPERSEDED

> **Decision 2026-04-26:** Superseded. `students` row created manually in signup API route. Kept for audit trail only.

---

## T1.8 — Error Boundary & Graceful Degradation

**Covers:** Cross-cutting — S1-F-01, S1-F-03, S1-F-04, S1-F-05, S1-F-06, S1-F-07, S1-F-10

### Error State Specification

```typescript
interface ApiError {
  error: string;    // SCREAMING_SNAKE_CASE
  message: string;  // human-readable, safe to display
  status: number;
}

// Error messages:
// Network offline  → "You're offline. Check your connection and try again."
// Auth failure     → "Sign in failed. Please try again."
// Server error     → "Something went wrong. Your data has not been saved."
// Timeout          → "This is taking longer than expected. Please try again."
// Duplicate email  → "An account with this email already exists. Sign in instead?"
```

### Acceptance Criteria

```gherkin
Scenario: Auth failure shows friendly message
  Given Supabase returns 500 during sign-in
  Then "Sign in failed. Please try again." is displayed
  And raw error is never shown

Scenario: Offline state communicated
  Given device is offline
  When signup form submitted
  Then "You're offline..." shown, form values retained

Scenario: Error boundary catches render crash
  Given a child component throws
  Then fallback UI with "Reload page" button is shown

Scenario: Loading state prevents double-submit
  Given form submitted
  When server action in flight
  Then submit button disabled + spinner shown
```

---

## T1.9 — Session Management & Sign-Out

> **Gap Fix — Session 4:** Redirect param validation guard added.
> **Gap Fix — Session 5 (G4, G9):** Full account_status redirect matrix defined. `declined` status middleware rule added.

**Covers:** S1-F-07

### Middleware Redirect Rules

```typescript
// middleware.ts
// After session validation, redirect based on account_status:

const REDIRECT_MATRIX = {
  // Unauthenticated → signin (with redirect param)
  NO_SESSION:         '/signin?redirect=<path>',

  // Authenticated — route by account_status + onboarding_completed
  active_onboarded:       null,              // allow through
  active_not_onboarded:  '/onboarding/subjects',
  pending_age_check:     '/onboarding/consent',
  pending_consent:       '/onboarding/awaiting-consent',
  declined:              '/signin',          // show declined-account message, no product access
  suspended:             '/signin',          // show suspended-account message

  // Authenticated trying to access /signin or /signup
  AUTH_ON_PUBLIC_AUTH_PAGE: '/dashboard',
}

// REDIRECT PARAM VALIDATION GUARD:
// After re-auth, before following ?redirect= param:
//   if redirect targets /onboarding/* AND onboarding_completed = true → override to /dashboard
//   if redirect targets /onboarding/consent AND account_status = 'active' → override to /dashboard
//   if account_status = 'declined' → always /signin (never follow any redirect to product)

const PUBLIC_PATHS = [
  '/signin', '/signup', '/verify-email',
  '/forgot-password', '/reset-password',
  '/legal', '/auth', '/api/auth',
  '/_next', '/favicon.ico',
];
```

### Acceptance Criteria

```gherkin
Scenario: Session persists after refresh
  Given signed-in student
  When they refresh
  Then they remain signed in

Scenario: Sign-out clears session
  Given signed-in student clicks Sign Out
  Then session cookie cleared, redirect = /signin
  And /dashboard redirects to /signin

Scenario: Expired session with redirect
  Given expired session, student was on /dashboard
  Then redirect = /signin?redirect=%2Fdashboard
  After sign-in → /dashboard

Scenario: Redirect guard — onboarding complete
  Given onboarding_completed = true, session expired on /onboarding/subjects
  When they sign in
  Then redirect = /dashboard (not /onboarding/subjects)

Scenario: Declined user cannot access any product page
  Given account_status = 'declined'
  When they attempt to access /dashboard or any product route
  Then redirect = /signin
  And signin page shows declined-account message

Scenario: pending_consent user redirected to awaiting-consent
  Given account_status = 'pending_consent'
  When they attempt to access /dashboard
  Then redirect = /onboarding/awaiting-consent

Scenario: Public paths accessible without auth
  Given unauthenticated user
  When navigating to /signin, /signup, /legal/privacy-policy, /forgot-password
  Then page loads without redirect
```

---

## T1.10 — Student Dashboard Shell

> **Gap Fix — Session 4:** NavBar in `(protected)` route group only.
> **Gap Fix — Session 5 (G5):** `/onboarding/*` guard extended to full namespace in layout.

**Covers:** S1-F-06

### Route Group Architecture

```
app/
  (public)/
    signin/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    verify-email/page.tsx
  (protected)/
    layout.tsx           ← NavBar + session check + /onboarding/* guard
    dashboard/page.tsx
    dashboard/loading.tsx
    onboarding/
      subjects/page.tsx
      consent/page.tsx
      awaiting-consent/page.tsx
      complete-profile/page.tsx  ← OAuth only, Sprint 2
    profile/page.tsx             ← Sprint 2+
  legal/
    privacy-policy/page.tsx
    terms-of-service/page.tsx
  auth/
    consent-expired/page.tsx
    consent-already-actioned/page.tsx
```

### (protected)/layout.tsx Specification

```typescript
export default async function ProtectedLayout({ children }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  // /onboarding/* namespace guard:
  // If student.onboarding_completed = true AND current path starts with /onboarding/
  // → redirect('/dashboard')
  // This protects the entire /onboarding/* namespace, not just /onboarding/subjects.

  return (
    <div>
      <NavBar />
      <main>{children}</main>
    </div>
  );
}
```

### Acceptance Criteria

```gherkin
Scenario: NavBar not on unauthenticated pages
  Given unauthenticated user on /signin or /signup
  Then NavBar is not rendered

Scenario: NavBar on all (protected) pages
  Given signed-in student on /dashboard or /onboarding/subjects
  Then NavBar is visible

Scenario: /onboarding/* namespace fully guarded for completed students
  Given onboarding_completed = true
  When student navigates to /onboarding/subjects
  Then redirect = /dashboard
  When student navigates to /onboarding/consent
  Then redirect = /dashboard
  When student navigates to /onboarding/awaiting-consent
  Then redirect = /dashboard

Scenario: Dashboard shows correct subjects
  Given student enrolled in AP Chemistry + AP US History
  When /dashboard loads
  Then 2 subject cards shown with "Diagnostic not yet taken"

Scenario: Dashboard server-side rendered
  When inspecting initial HTML before client JS
  Then subject names and welcome message are in the HTML

Scenario: Incomplete onboarding → /onboarding/subjects
  Given onboarding_completed = false
  When student hits /dashboard
  Then redirect = /onboarding/subjects
```

---

## T1.11 — Account Recovery (Forgot Password)

**Covers:** S1-F-10 (P1)

### Zod Schema

```typescript
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ['confirmPassword'] }
);
```

### Acceptance Criteria

```gherkin
Scenario: Reset email without revealing account existence
  Given any email to POST /api/auth/forgot-password
  Then HTTP 200, { message: "If an account exists, we've sent a reset link" }

Scenario: Password strength enforced
  Given invalid password
  Then specific inline error, supabase.auth.updateUser NOT called

Scenario: Successful reset
  Given valid new password
  Then redirect = /signin, banner: "Password updated. Please sign in."

Scenario: Forgot password link on signin
  Given /signin page
  Then "Forgot password?" link navigates to /forgot-password
```

### Implementation Notes
- Reset email via Supabase native — not Resend
- `/reset-password` must be a client component (URL hash not available server-side)
- After update, call `supabase.auth.signOut()` before redirecting to `/signin`

---

## T1.12 — Onboarding Flow UI Pages

> **Added Session 4.** Gap: API routes redirect to pages that had no UI spec.
> **Gap Fix — Session 5 (G2):** Resend + correct-email flows fully specced on awaiting-consent page.

**Covers:** S1-F-03, S1-F-04 (UI layer)

### Pages Required

| Route | Rendered In | Description |
|---|---|---|
| `/onboarding/consent` | `(protected)` | Minor enters parent email. Form + submit. |
| `/onboarding/awaiting-consent` | `(protected)` | Holding screen. Resend + correct-email escape hatches. |
| `/verify-email` | `(public)` | Holding screen for all users after signup. Resend verification. |
| `/auth/consent-expired` | `(public)` | Parent lands here on expired token. Static. |
| `/auth/consent-already-actioned` | `(public)` | Parent lands here on already-used token. Static. |

### `/onboarding/awaiting-consent` — Full Specification (G2)

```typescript
// Server component with client islands for buttons
// On load:
//   1. Fetch students row → get parent_email
//   2. If account_status = 'active' → redirect('/onboarding/subjects')
//      (parent already approved while student was on this page)
//   3. Render holding screen

// Displayed:
//   Heading: "Waiting for approval"
//   Body: "We sent an approval request to [masked parent email].
//          Once your parent approves, you'll be able to access AceOS."
//   Masked email format: first char + *** + @domain  (e.g. j***@gmail.com)
//   Implemented in: lib/utils/mask-email.ts

// Actions:
//   [Resend] button:
//     → POST /api/auth/consent/send  (re-sends to same parent_email stored on students row)
//     → On success: toast "Approval request resent"
//     → Button disabled for 60 seconds after click (same cooldown pattern as verify-email)
//
//   [Wrong email? Change it] link:
//     → navigates to /onboarding/consent
//     → student can enter a new parent email
//     → submitting /onboarding/consent will overwrite students.parent_email
//       and re-send the consent email

// Polling:
//   Poll GET /api/auth/me (or use supabase realtime on students row) every 30s
//   If account_status changes to 'active' → redirect to /onboarding/subjects
```

### `/onboarding/consent` — Specification

```typescript
// Client component
// Fields: parent_email (email input, required)
// On submit: POST /api/auth/consent/send
// Success: redirect to /onboarding/awaiting-consent
// Error — invalid email: "Please enter a valid email address"
// Error — API error: "Something went wrong. Please try again."
// Copy:
//   Heading: "One more step"
//   Body: "Because you're under 18, a parent or guardian needs to approve your account."
//   Button: "Send Approval Request"
```

### `/verify-email` — Specification

```typescript
// Client component
// Copy:
//   Heading: "Check your inbox"
//   Body: "We sent a verification link to [masked student email]."
//   Resend button: supabase.auth.resend({ type: 'signup', email })
//   Cooldown: 60s disabled after click, countdown shown
//   onAuthStateChange: if SIGNED_IN fires → redirect based on account_status
```

### Static Pages

```
/auth/consent-expired:
  Heading: "This approval link has expired"
  Body: "Approval links are valid for 7 days. [Student First Name] can log in and request a new one."
  CTA: → /signin

/auth/consent-already-actioned:
  Heading: "This link has already been used"
  Body: "You've already responded to this approval request."
  CTA: → /signin
```

### Acceptance Criteria

```gherkin
Scenario: Minor submits parent email → awaiting-consent
  Given minor on /onboarding/consent submits valid parent email
  Then POST /api/auth/consent/send called
  And redirect = /onboarding/awaiting-consent
  And awaiting screen shows masked parent email

Scenario: Invalid parent email inline error
  Given "notanemail" submitted
  Then "Please enter a valid email address" shown
  And API NOT called

Scenario: Resend button re-sends email
  Given student on /onboarding/awaiting-consent
  When they click Resend
  Then POST /api/auth/consent/send called
  And toast: "Approval request resent"
  And button disabled for 60 seconds

Scenario: Wrong email link returns to consent form
  Given student on /onboarding/awaiting-consent
  When they click "Wrong email? Change it"
  Then they are navigated to /onboarding/consent
  And submitting new email overwrites students.parent_email

Scenario: Approved student auto-redirected from awaiting-consent
  Given student on /onboarding/awaiting-consent
  And parent has approved (account_status = 'active')
  When page detects status change (poll or realtime)
  Then redirect = /onboarding/subjects

Scenario: verify-email resend cooldown
  Given student clicks Resend on /verify-email
  Then button disabled for 60 seconds with countdown

Scenario: Expired consent link
  Given parent clicks expired link
  Then /auth/consent-expired shows with /signin CTA

Scenario: Already-used consent link
  Given parent clicks already-used link
  Then /auth/consent-already-actioned shows
```

---

*Sprint 1 Technical Stories | Epic 1: Foundation & Legal | AceOS v1.0*
*Last updated: 2026-04-26 (Session 5) — G1: minor flow fixed (verify email first). G2: awaiting-consent resend + wrong-email specced. G3: T1.6 placeholder strategy. G4: T1.9 full redirect matrix. G5: T1.10 /onboarding/* namespace guard. G6: T1.1 parent_email column. G7: T1.4 approve/deny routes fully specced. G8: T1.1 consent_log index. G9: T1.9 declined status rule. G10: T1.4 SELECT FOR UPDATE race guard. CONSENT_JWT_SECRET separated from service role key.*
