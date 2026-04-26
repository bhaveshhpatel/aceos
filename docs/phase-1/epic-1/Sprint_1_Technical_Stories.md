# Sprint 1 — Technical Stories
## Epic 1: Foundation & Legal | Phase 1: ScoreBoost AP
**Sprints 1–2 | Weeks 1–2 | AceOS v1.0**

---

## Overview

These technical stories define the engineering implementation for Sprint 1. Every story is written so that a lead engineer can read it, derive Gherkin (Given/When/Then) scenarios, build an automation test suite, and implement the feature correctly — in that order.

**Test-Forward Requirement:** For every story below, tests are written BEFORE implementation. The acceptance criteria are the test specification.

---

## T1.1 — Supabase Project Initialization & Schema Bootstrap

**As a** backend engineer,
**I need** the Supabase project configured with the initial database schema, RLS policies, and auth settings,
**So that** all subsequent features have a secure, consistent data foundation.

### Scope
- Create Supabase project (production + staging environments)
- Run initial migration creating all Phase 1 tables
- Configure Row Level Security (RLS) on every table
- Configure Supabase Auth (email/password + Google OAuth provider)

### Database Schema — Initial Migration

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  is_minor BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN date_of_birth IS NOT NULL
    THEN (CURRENT_DATE - date_of_birth) < INTERVAL '18 years'
    ELSE NULL END
  ) STORED,
  parental_consent_status TEXT CHECK (
    parental_consent_status IN ('pending', 'granted', 'denied', 'not_required')
  ) DEFAULT 'pending',
  parental_consent_email TEXT,
  parental_consent_granted_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_intelligence_profile (SIP)
CREATE TABLE student_intelligence_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ap_subjects TEXT[] DEFAULT '{}',
  predicted_ap_scores JSONB DEFAULT '{}',
  gpa_current NUMERIC(3,2),
  gpa_target NUMERIC(3,2),
  study_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- subject_selections
CREATE TABLE subject_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  exam_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_code)
);

-- consent_audit_log (immutable audit trail)
CREATE TABLE consent_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'consent_email_sent',
      'consent_granted',
      'consent_denied',
      'consent_revoked',
      'age_verified_adult'
    )
  ),
  actor_email TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- provider_config (PID model — runtime-swappable)
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
-- profiles: users can only read/write their own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- SIP: student reads/writes only their own
ALTER TABLE student_intelligence_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sip_select_own" ON student_intelligence_profiles
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "sip_insert_own" ON student_intelligence_profiles
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "sip_update_own" ON student_intelligence_profiles
  FOR UPDATE USING (auth.uid() = student_id);

-- subject_selections: student reads/writes only their own
ALTER TABLE subject_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_select_own" ON subject_selections
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "subjects_insert_own" ON subject_selections
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- consent_audit_log: insert-only from server, no client reads
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_log_insert_service_only" ON consent_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "consent_log_no_client_read" ON consent_audit_log
  FOR SELECT USING (FALSE);
```

### Acceptance Criteria

```gherkin
Scenario: RLS prevents cross-user data access
  Given two users Alice and Bob exist in the database
  And each has a profile and SIP record
  When Alice's JWT is used to query profiles WHERE id = Bob's id
  Then the result set is empty
  And no error is thrown (silent deny)

Scenario: Service role can write to consent_audit_log
  Given a server-side Supabase client using service_role key
  When it inserts a consent_audit_log record for a student
  Then the insert succeeds
  And the record is retrievable by service_role

Scenario: Client cannot read consent_audit_log
  Given an authenticated user JWT
  When the client queries consent_audit_log
  Then zero rows are returned regardless of filter

Scenario: profiles.is_minor is computed correctly
  Given a profile with date_of_birth 10 years ago
  Then is_minor = TRUE
  Given a profile with date_of_birth 20 years ago
  Then is_minor = FALSE

Scenario: Supabase auth Google OAuth is configured
  Given a user initiates Google OAuth sign-in
  When the OAuth callback is received
  Then a new auth.users record is created
  And a profiles record is created via database trigger
```

### Implementation Notes
- `profiles` record must be auto-created on `auth.users` insert via a Postgres trigger + function
- `updated_at` on `profiles` and `sip` must auto-update via trigger
- Staging and production must be separate Supabase projects — never share a database
- All migrations must be version-controlled under `supabase/migrations/`
- Migration file naming: `YYYYMMDDHHMMSS_description.sql`

---

## T1.2 — Vercel Deployment Pipeline

**As a** DevOps engineer,
**I need** a CI/CD pipeline deploying the Next.js app to Vercel on every push to `main` and creating preview deployments on every PR,
**So that** the team can review changes in isolation and ship to production with confidence.

### Pipeline Specification

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL_STAGING }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY_STAGING }}

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Environment Variable Schema

```
# .env.local (never committed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LITELLM_GATEWAY_URL=
LITELLM_API_KEY=
MODAL_API_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

### Acceptance Criteria

```gherkin
Scenario: PR triggers preview deployment
  Given a developer opens a pull request against main
  When all CI tests pass
  Then a Vercel preview URL is posted as a PR comment
  And the preview reflects the PR branch code exactly

Scenario: Push to main triggers production deployment
  Given a PR is merged to main
  When CI tests pass
  Then production deployment completes within 5 minutes
  And the production URL serves the updated code

Scenario: Failed tests block deployment
  Given a PR with a failing unit test
  When CI runs
  Then the deploy-preview job does not execute
  And the PR is marked as failing

Scenario: Environment variables are not exposed in client bundle
  Given the production build is complete
  When the client-side JavaScript bundle is inspected
  Then SUPABASE_SERVICE_ROLE_KEY is not present anywhere in the bundle
  And LITELLM_API_KEY is not present anywhere in the bundle
```

---

## T1.3 — LiteLLM Gateway Configuration

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

Scenario: Tutor route uses Groq for low latency
  Given model_map.json has tutor_response mapped to groq/llama-3.1-70b-versatile
  When callAI is invoked with route: "tutor_response"
  Then latency_ms < 2000 in 95% of calls under normal load

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
- Prompt version is logged with every AI call for auditability

---

## T1.4 — Authentication System Implementation

**As a** backend engineer,
**I need** email/password and Google OAuth authentication with an age-gate flow that triggers a parental consent email for minors,
**So that** the app is FERPA-compliant before any student data is stored.

### Auth Flow State Machine

```
[/signup] 
    → collect email + password + name + DOB
    → create auth.users record (Supabase)
    → create profiles record (trigger)
    → if age < 18:
        → set parental_consent_status = 'pending'
        → send consent email to parent_email
        → redirect to /onboarding/awaiting-consent
    → if age >= 18:
        → set parental_consent_status = 'not_required'
        → log 'age_verified_adult' to consent_audit_log
        → redirect to /onboarding/subject-select

[/auth/consent-callback?token=X]
    → verify token (JWT, signed with service key, 72-hour expiry)
    → if valid:
        → set parental_consent_status = 'granted'
        → log 'consent_granted' to consent_audit_log
        → send confirmation email to student
    → if expired:
        → redirect to /auth/consent-expired
    → if already actioned:
        → redirect to /auth/consent-already-actioned

[/auth/consent-deny?token=X]
    → verify token
    → if valid:
        → set parental_consent_status = 'denied'
        → log 'consent_denied' to consent_audit_log
        → delete auth.users record (FERPA — no data retained without consent)
```

### Consent Email Specification

```
Subject: [Action Required] Your student wants to use AceOS

Hi [Parent Name],

[Student Name] ([Student Email]) signed up for AceOS — an AP exam prep
and GPA tracking tool.

AceOS stores academic data including practice scores and GPA records.
Because [Student Name] is under 18, we need your permission before
storing any data.

[APPROVE ACCESS] — links to /auth/consent-callback?token=JWT
[DECLINE ACCESS] — links to /auth/consent-deny?token=JWT

This link expires in 72 hours.

If you did not expect this email, you can safely ignore it.
No data has been stored yet.

— The AceOS Team
Privacy Policy: [link]
```

### Acceptance Criteria

```gherkin
Scenario: Adult signup bypasses parental consent
  Given a user signs up with a date_of_birth 20 years ago
  When signup completes
  Then profiles.parental_consent_status = 'not_required'
  And consent_audit_log has one record with event_type = 'age_verified_adult'
  And user is redirected to /onboarding/subject-select

Scenario: Minor signup triggers consent email
  Given a user signs up with a date_of_birth 15 years ago
  And they provide parent_email = "parent@example.com"
  When signup completes
  Then profiles.parental_consent_status = 'pending'
  And an email is sent to parent@example.com within 30 seconds
  And the email contains an approval link with a valid JWT token
  And the user is redirected to /onboarding/awaiting-consent

Scenario: Parent approves consent
  Given a minor student has parental_consent_status = 'pending'
  And the parent receives the consent email
  When the parent clicks the approval link
  Then profiles.parental_consent_status = 'granted'
  And consent_audit_log records event_type = 'consent_granted'
  And the student receives a confirmation email
  And the student is unblocked and redirected to /onboarding/subject-select on next login

Scenario: Parent denies consent
  Given a minor student has parental_consent_status = 'pending'
  When the parent clicks the denial link
  Then profiles.parental_consent_status = 'denied'
  And the auth.users record is deleted
  And no student data is retained in any table

Scenario: Consent token expires after 72 hours
  Given a consent email was sent 73 hours ago
  When the parent clicks the approval link
  Then they see the /auth/consent-expired page
  And profiles.parental_consent_status remains 'pending'
  And a new consent email can be re-requested

Scenario: Minor cannot access app without consent
  Given a minor with parental_consent_status = 'pending' or 'denied'
  When they attempt to navigate to any authenticated route
  Then they are redirected to /onboarding/awaiting-consent
  And no data is displayed or stored

Scenario: Google OAuth creates profile record
  Given a user signs in via Google OAuth for the first time
  When the OAuth callback is processed
  Then a profiles record is created with data from the Google ID token
  And the age gate is applied based on any available DOB data
  And if DOB is unavailable, the user is prompted to enter it
```

### Implementation Notes
- Consent JWT must be signed with `SUPABASE_SERVICE_ROLE_KEY`, never the anon key
- Consent token payload: `{ student_id, parent_email, exp: now + 72h }`
- The delete-on-deny operation must be a server-side action, never a client call
- Google OAuth: if DOB not available from Google profile, prompt user for DOB in a post-auth step before completing onboarding

---

## T1.5 — Subject Selection Screen Implementation

**As a** frontend engineer,
**I need** the subject selection screen to display the 6 Phase 1 AP subjects with exam date pickers and persist selections to the database,
**So that** the SIP can be initialized with the student's subjects and target exam dates.

### Subject Registry (Phase 1)

```typescript
// config/subjects.ts
export const PHASE_1_SUBJECTS = [
  {
    code: 'AP_CHEM',
    name: 'AP Chemistry',
    type: 'VISUAL',
    units: 9,
    exam_date_2026: '2026-05-04',
    icon: '🧪',
  },
  {
    code: 'AP_BIO',
    name: 'AP Biology',
    type: 'VISUAL',
    units: 8,
    exam_date_2026: '2026-05-08',
    icon: '🧬',
  },
  {
    code: 'AP_CALC_AB',
    name: 'AP Calculus AB',
    type: 'VISUAL',
    units: 10,
    exam_date_2026: '2026-05-04',
    icon: '∫',
  },
  {
    code: 'AP_USHISTORY',
    name: 'AP US History',
    type: 'TEXT',
    units: 9,
    exam_date_2026: '2026-05-07',
    icon: '🇺🇸',
  },
  {
    code: 'AP_WORLDHISTORY',
    name: 'AP World History',
    type: 'TEXT',
    units: 9,
    exam_date_2026: '2026-05-14',
    icon: '🌍',
  },
  {
    code: 'AP_LANG',
    name: 'AP English Language & Composition',
    type: 'TEXT',
    units: 9,
    exam_date_2026: '2026-05-13',
    icon: '✍️',
  },
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
  // 1. Validate: min 1, max 6 subjects
  // 2. Upsert subject_selections records
  // 3. Initialize or update SIP.ap_subjects array
  // 4. Return success or structured error
}
```

### Acceptance Criteria

```gherkin
Scenario: Student sees all 6 Phase 1 subjects
  Given an authenticated user on /onboarding/subject-select
  When the page loads
  Then exactly 6 AP subject cards are displayed
  And each card shows subject name, type badge (TEXT/VISUAL), and exam date
  And all 6 subjects are unselected by default

Scenario: Student selects subjects and saves
  Given a student selects AP Chemistry and AP US History
  When they click "Continue"
  Then two records are inserted into subject_selections
  And student_intelligence_profiles.ap_subjects = ['AP_CHEM', 'AP_USHISTORY']
  And the user is redirected to /dashboard

Scenario: Student cannot continue with zero selections
  Given no subjects are selected
  When the student clicks "Continue"
  Then a validation error is shown: "Select at least one AP subject to continue"
  And no database write occurs

Scenario: Exam date defaults to College Board 2026 date
  Given a student selects AP Chemistry
  Then the exam date field defaults to 2026-05-04
  And the student can override it with a custom date

Scenario: Subject selection persists across page refresh
  Given a student selected AP Chemistry in a previous session
  When they return to /onboarding/subject-select
  Then AP Chemistry card is shown as already selected
  And a "Change subjects" UI is available

Scenario: SIP is initialized after subject selection
  Given a student saves two subject selections
  When the server action completes
  Then a student_intelligence_profiles record exists for the student
  And ap_subjects contains the two selected subject codes
  And predicted_ap_scores is an empty object (to be populated post-diagnostic)
```

---

## T1.6 — Privacy Policy & Terms of Service Legal Pages

**As a** frontend engineer,
**I need** the Privacy Policy and Terms of Service to be live at dedicated URLs and linked from every auth screen,
**So that** we are legally compliant before any user signs up.

### Route Requirements

| Route | Content | Must Be Live Before |
|---|---|---|
| `/legal/privacy-policy` | Full FERPA-compliant privacy policy | First user signup |
| `/legal/terms-of-service` | ToS with minor provisions | First user signup |

### Acceptance Criteria

```gherkin
Scenario: Privacy Policy is accessible pre-auth
  Given an unauthenticated user
  When they navigate to /legal/privacy-policy
  Then the full privacy policy text is displayed
  And no login is required
  And the page is indexable by search engines

Scenario: Terms link is present on signup form
  Given a user on the /signup page
  Then the signup form contains a link to /legal/terms-of-service
  And a link to /legal/privacy-policy
  And both links open in a new tab
  And the "Create account" button is disabled until the checkbox is checked

Scenario: Consent email links to Privacy Policy
  Given a parental consent email was sent
  When the parent views the email
  Then the email contains a clickable link to /legal/privacy-policy
  And the link resolves to the live page

Scenario: Legal pages render on all viewport sizes
  Given the Privacy Policy page
  When viewed on a 375px wide mobile viewport
  Then all text is readable without horizontal scroll
  And no content is clipped
```

---

## T1.7 — Profile Auto-Creation Trigger

**As a** backend engineer,
**I need** a Postgres trigger that automatically creates a `profiles` record whenever a new `auth.users` record is inserted,
**So that** the application never has an authenticated user without a corresponding profile.

### Trigger Implementation

```sql
-- Function to create profile on new auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to keep updated_at current
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Acceptance Criteria

```gherkin
Scenario: Profile is auto-created on new signup
  Given a user completes email/password signup
  When the auth.users record is created
  Then a profiles record exists with the same id within 100ms
  And profiles.email matches auth.users.email

Scenario: Profile auto-creation is idempotent
  Given a profiles record already exists for a user id
  When the trigger fires again for the same user id (e.g., duplicate call)
  Then no error is thrown (ON CONFLICT DO NOTHING)
  And the existing profile is unchanged

Scenario: updated_at is automatically maintained
  Given a profiles record with updated_at = T1
  When any column on the profiles record is updated
  Then profiles.updated_at > T1 immediately after the update
```

---

## T1.8 — Error Boundary & Graceful Degradation

**As a** frontend engineer,
**I need** React error boundaries and structured error states on all auth and onboarding pages,
**So that** a user never sees a raw error or blank screen if any service fails.

### Error State Specification

```typescript
// components/ErrorBoundary.tsx
// Catches unhandled render errors — shows friendly message + retry button

// Error states required on every form:
// - Network offline: "You're offline. Check your connection and try again."
// - Supabase auth error: "Sign in failed. Please try again." (never expose raw Supabase error)
// - Server action error: "Something went wrong. Your data has not been saved."
// - Timeout: "This is taking longer than expected. Try again."
```

### Acceptance Criteria

```gherkin
Scenario: Auth failure shows user-friendly message
  Given Supabase returns a 500 error during sign-in
  When the user submits the sign-in form
  Then the message "Sign in failed. Please try again." is displayed
  And the raw error message is never shown to the user
  And the error is logged to Sentry with full context

Scenario: Offline state is communicated
  Given the user's device is offline
  When they submit the signup form
  Then the message "You're offline. Check your connection and try again." is shown
  And the form remains filled with their input (no data loss)

Scenario: Error boundary catches render crash
  Given any child component throws an unhandled error
  When the error boundary catches it
  Then a fallback UI is shown with a "Reload page" button
  And the error is reported to Sentry
  And no blank/white screen is shown

Scenario: Loading states prevent double-submit
  Given a user submits the signup form
  When the server action is in flight
  Then the submit button is disabled and shows a loading spinner
  And submitting again before completion has no effect
```

---

*Sprint 1 Technical Stories | Epic 1: Foundation & Legal | AceOS v1.0*
*Test-Forward: Write Gherkin → Build automation suite → Implement → Verify*
