# Epic 1 — Foundation & Legal
## Sprint 1: Functional Stories (Weeks 1–2)
### Infrastructure · Identity · Compliance Foundation

**Sprint Goal:** A student can sign up, confirm parental consent (if under 18), select an AP subject, and reach the dashboard — with all data encrypted at rest and row-level security enforced. College Board content legal review is complete and the Content Creation Protocol is signed off before any diagnostic questions are written.

> **Email provider:** All transactional emails sent via Resend from `onboarding@resend.dev` (Sprint 1). Custom domain (`hello@aceos.app`) deferred to Sprint 2.

---

## Story Index

| ID | Title | Priority |
|---|---|---|
| S1-F-01 | Email Sign-Up | P0 |
| S1-F-02 | Google OAuth Sign-Up & Sign-In | ⏸ Descoped — Sprint 2 |
| S1-F-03 | Age Gate & Parental Consent Flow | P0 |
| S1-F-04 | Email Verification | P0 |
| S1-F-05 | Student Onboarding: AP Subject Selection | P0 |
| S1-F-06 | Student Dashboard Shell | P0 |
| S1-F-07 | Session Persistence & Sign-Out | P0 |
| S1-F-08 | Privacy Policy & Terms of Service Acceptance | P0 |
| S1-F-09 | Parental Consent Email Delivery | P0 |
| S1-F-10 | Account Recovery (Forgot Password) | P1 |

---

## S1-F-01 · Email Sign-Up

> **Re-validated: Session 5 (2026-04-26)** — PSE × PPM deliberation. AC-03b, AC-05b, AC-05c, AC-06 (expanded), and AC-07 added. Story had not been formally re-reviewed after G1 flow change. Now validated against current T1.4 state machine.

**As a** prospective student,
**I want to** create an AceOS account using my email address and a password,
**so that** I can access the platform without needing a Google account.

### User Flow
1. User visits `/signup`.
2. User enters: first name, last name, email address, password, date of birth.
3. User checks the Privacy Policy & ToS checkbox.
4. User clicks **Create Account**.
5. System validates all fields (client-side AND server-side via Zod).
6. System creates a Supabase Auth user and a matching `students` row.
7. **All users** are redirected to `/verify-email` first.
8. After verifying email: adults → `/onboarding/subjects`; minors → `/onboarding/consent`.

### Acceptance Criteria

**AC-01 · Valid registration succeeds**
- Given a user submits all required fields with a valid email, a password ≥ 8 characters containing at least one uppercase letter and one number, and a valid date of birth
- When they click **Create Account**
- Then a new account is created, an email verification link is sent via Resend (see S1-F-04), and the user sees the `/verify-email` holding screen

**AC-02 · Duplicate email is rejected**
- Given an email address that already exists in the system
- When the user submits the sign-up form with that email
- Then the form shows an inline error: "An account with this email already exists. Sign in instead?"
- And no new account is created

**AC-03 · Password too weak is rejected (client-side)**
- Given a password shorter than 8 characters or missing an uppercase letter or missing a number
- When the user submits the form
- Then the password field shows the specific rule that failed
- And the form does not submit

**AC-03b · Password too weak is rejected (server-side) — added Session 5**
- Given a direct POST to `/api/auth/signup` with a weak password that bypasses client-side validation
- When the API processes the request
- Then the API returns HTTP 400 with `{ error: 'VALIDATION_ERROR', fields: { password: '<specific rule message>' } }`
- And `supabase.auth.admin.createUser` is NOT called

**AC-04 · Missing required field blocks submission**
- Given any required field (first name, last name, email, password, date of birth) is empty
- When the user attempts to submit
- Then the empty field is highlighted with an inline error message
- And the form does not submit

**AC-05 · Date of birth is required and valid**
- Given a date of birth entered that is in the future or more than 100 years ago
- When the user submits
- Then the DOB field shows "Please enter a valid date of birth"

**AC-05b · Exactly 18 today is treated as adult — added Session 5**
- Given a date of birth that makes the student exactly 18 years old on the day of sign-up
- When they submit the form
- Then `students.account_status` is set to `active`
- And the student is NOT routed through the parental consent flow

**AC-05c · 17 years 364 days old is treated as minor — added Session 5**
- Given a date of birth that makes the student 17 years and 364 days old on the day of sign-up (birthday is tomorrow)
- When they submit the form
- Then `students.account_status` is set to `pending_age_check`
- And the student IS routed through the parental consent flow after email verification

**AC-06 · User row created in database with complete shape — expanded Session 5**
- Given a successful sign-up
- Then a row exists in `students` with ALL of the following:
  - `id` matching the Supabase Auth UID
  - `email`, `first_name`, `last_name`, `dob` set to submitted values
  - `account_status` = `'active'` (adult) or `'pending_age_check'` (minor)
  - `email_verified` = `false`
  - `onboarding_completed` = `false`
  - `parent_email` = `null` (set later by `POST /api/auth/consent/send`, not at signup)
- And row-level security permits only that student's own UID to read the row

**AC-07 · Signup failure is atomic — added Session 5**
- Given the system successfully creates a Supabase Auth user but then fails to insert the `students` row
- When the error is caught
- Then `supabase.auth.admin.deleteUser` is called with the newly created auth UID (rollback)
- And the API returns HTTP 500 with `{ error: 'SIGNUP_FAILED' }` (no raw DB error exposed to client)
- And a student who encountered this error can retry sign-up with the same email without receiving a duplicate-email error

---

## S1-F-02 · Google OAuth Sign-Up & Sign-In ⏸ DESCOPED — SPRINT 2

> **Decision — 2026-04-26 (Session 4):** Descoped from Sprint 1 to Sprint 2. Requires a Google Cloud project and OAuth 2.0 credentials before any code can be written. See T1.4b in the technical stories for the full spec and the pre-implementation checklist that must be completed before Sprint 2 work begins.

**As a** student,
**I want to** sign up or sign in using my Google account,
**so that** I do not need to remember a separate password.

### User Flow
1. User clicks **Continue with Google** on `/signup` or `/signin`.
2. Google OAuth popup opens.
3. User selects their Google account and grants permission.
4. On first sign-in: user is directed to complete-profile screen (first name, last name, DOB) then age gate check.
5. On returning sign-in: system restores session and redirects to dashboard.

### Acceptance Criteria

**AC-01 · New Google user is onboarded**
- Given a Google account that has never signed into AceOS
- When the user completes the Google OAuth flow
- Then a new `students` row is created with name and email from Google profile
- And the user is redirected to the complete-profile screen to provide DOB
- And after completing the profile, the age gate flow runs as normal

**AC-02 · Returning Google user reaches dashboard**
- Given a Google account with an existing, onboarded AceOS account
- When the user completes the Google OAuth flow
- Then the user is redirected to `/dashboard` with their session restored

**AC-03 · OAuth failure shows friendly error**
- Given the Google OAuth flow fails
- When the flow returns to AceOS
- Then the user sees: "Sign-in with Google failed. Please try again or use email instead."
- And no account is created or modified

**AC-04 · No duplicate accounts on repeated OAuth**
- Given a student who previously signed up with email using the same address as their Google account
- When they attempt Google OAuth
- Then the system links to the existing account (no duplicate row created)
- And the user is signed in normally

---

## S1-F-03 · Age Gate & Parental Consent Flow

**As a** student who is under 18,
**I want to** have a parental consent step in my sign-up,
**so that** my parent can authorize my use of the platform in compliance with FERPA/COPPA requirements.

> **Auth flow decision (Session 5):** Email verification happens FIRST for all users, including minors. A minor verifies their email, THEN enters the parent email on `/onboarding/consent`. This ensures the student email is valid before any parental consent request is sent.

### User Flow (Minor)
1. After account creation, minor is redirected to `/verify-email` (`account_status = pending_age_check`).
2. Minor clicks email verification link → `email_verified = true`.
3. Because `account_status = pending_age_check` → redirected to `/onboarding/consent`.
4. Minor enters parent/guardian email and submits.
5. System sends consent email via Resend (`onboarding@resend.dev`) — see S1-F-09.
6. `account_status` updated to `pending_consent`.
7. Minor redirected to `/onboarding/awaiting-consent` holding screen.
8. Minor can resend consent email or correct the parent email from this screen.
9. Parent clicks **Approve** → `account_status = active` → minor can now sign in and reach `/onboarding/subjects`.

### User Flow (Adult)
1. After account creation, adult is redirected to `/verify-email` (`account_status = active`).
2. Adult clicks email verification link → redirected directly to `/onboarding/subjects`.

### Acceptance Criteria

**AC-01 · Under-18 user is gated after email verification**
- Given a student whose DOB makes them under 18 at time of sign-up
- When they click their email verification link
- Then they are redirected to `/onboarding/consent`
- And their account status is `pending_age_check` (changes to `pending_consent` after they submit the parent email)

**AC-02 · Over-18 user bypasses consent**
- Given a student whose DOB makes them 18 or older
- When they click their email verification link
- Then they are redirected directly to `/onboarding/subjects`
- And their account status is `active`

**AC-03 · Consent email is sent**
- Given an under-18 student who enters a valid parent email on `/onboarding/consent`
- When they submit the form
- Then a consent email is delivered to the parent email address within 2 minutes
- And the email contains an Approve button/link and a brief explanation of what AceOS is

**AC-04 · Invalid parent email is caught**
- Given an under-18 student who enters a malformed or missing parent email
- When they attempt to submit the parental consent screen
- Then an inline error appears: "Please enter a valid email address"

**AC-05 · Parent approval activates the account**
- Given a parent who receives and clicks the approval link
- When the approval is processed
- Then the student's `account_status` changes from `pending_consent` to `active`
- And the student receives a confirmation email: "Your AceOS account is approved — you can now sign in."

**AC-06 · Unapproved student cannot access features**
- Given a student with `account_status = pending_consent`
- When they attempt to navigate to any product page
- Then they are redirected to `/onboarding/awaiting-consent`
- And no product data is accessible

**AC-07 · Parent can decline consent**
- Given a parent who clicks **Decline** in the consent email
- When the decline is processed
- Then the student's account is soft-deleted (`account_status = declined`)
- And the student receives an email: "Your account could not be activated."

**AC-08 · Student can resend consent email from waiting screen**
- Given a student on `/onboarding/awaiting-consent`
- When they click **Resend**
- Then the consent email is re-sent to the same parent email
- And a success message is shown: "Approval request resent"

**AC-09 · Student can correct parent email**
- Given a student on `/onboarding/awaiting-consent`
- When they click "Wrong email?"
- Then they are navigated back to `/onboarding/consent` to re-enter the parent email

**AC-10 · Declined user cannot access features or re-enter flow**
- Given a student with `account_status = declined`
- When they attempt to sign in
- Then they see: "Your account could not be activated. Please speak with your parent or guardian."
- And they cannot access any product page

---

## S1-F-04 · Email Verification

**As a** student who signed up with email,
**I want to** verify my email address,
**so that** I can confirm I own the address and protect my account.

### User Flow
1. After email sign-up, **all users** are shown the `/verify-email` holding screen.
2. User opens verification email and clicks the verification link.
3. System marks `email_verified = true`.
4. User is redirected based on `account_status`:
   - `active` (adult) → `/onboarding/subjects`
   - `pending_age_check` (minor, not yet submitted parent email) → `/onboarding/consent`
   - `pending_consent` (minor, parent email already submitted) → `/onboarding/awaiting-consent`

### Acceptance Criteria

**AC-01 · Verification link marks email verified and routes correctly**
- Given a student who has not yet verified their email
- When they click the verification link in the email
- Then `email_verified` is set to `true` in the database
- And they are redirected to the correct next step based on their account_status (see flow above)

**AC-02 · Expired link shows helpful message**
- Given a verification link that is more than 24 hours old
- When the student clicks it
- Then they see: "This link has expired. Click below to resend a new verification email."
- And a **Resend Email** button is available

**AC-03 · Unverified user cannot access features**
- Given a student who has not verified their email
- When they attempt to navigate to any product page
- Then they are redirected to `/verify-email`
- And no product data is accessible

**AC-04 · Resend works correctly**
- Given a student who requests a new verification email
- When the resend is triggered
- Then a new email is sent within 2 minutes
- And the resend button is disabled for 60 seconds after clicking (cooldown)

---

## S1-F-05 · Student Onboarding: AP Subject Selection

**As a** newly registered student,
**I want to** select the AP subjects I am currently taking,
**so that** AceOS can set up my study environment and Student Intelligence Profile.

### User Flow
1. After verification (and consent if under 18), user arrives at `/onboarding/subjects`.
2. Screen shows a grid of the 6 available AP subjects.
3. Student selects 1–4 subjects.
4. Student clicks **Continue**.
5. System creates `student_subjects` rows with `mastery_data = {}` and sets `onboarding_completed = true`.
6. Student is redirected to the dashboard.

### Acceptance Criteria

**AC-01 · Subject selection screen loads correctly**
- Given a student who has completed email verification and any required consent
- When they reach the onboarding screen
- Then all 6 available AP subjects are shown with name, icon, and a selectable card UI
- And no subject is pre-selected

**AC-02 · Single subject selection minimum**
- Given a student who attempts to continue with 0 subjects selected
- When they click **Continue**
- Then an inline message appears: "Please select at least one AP subject to continue"
- And navigation is blocked

**AC-03 · Maximum 4 subjects enforced**
- Given a student who has already selected 4 subjects
- When they attempt to select a 5th
- Then the 5th subject card does not become selected
- And a tooltip or message appears: "You can add more subjects later from your dashboard"

**AC-04 · Subject rows are created in database**
- Given a student who selects 2 subjects and clicks Continue
- Then 2 rows exist in `student_subjects` with correct `student_id` and `subject_code` values
- And each row has `mastery_data = {}` (empty object, ready for Sprint 2 scoring)
- And `students.onboarding_completed` is set to `true`

**AC-05 · Student reaches dashboard after selection**
- Given a student who selects at least 1 subject and clicks Continue
- Then they are redirected to `/dashboard`
- And the dashboard displays their selected subjects

**AC-06 · Onboarding cannot be revisited**
- Given a student who has already completed onboarding (`onboarding_completed = true`)
- When they navigate directly to any `/onboarding/*` route
- Then they are redirected to `/dashboard`

---

## S1-F-06 · Student Dashboard Shell

**As a** student who has completed onboarding,
**I want to** see a dashboard that reflects my selected subjects,
**so that** I have a home base for all my study activities.

### User Flow
1. Student arrives at `/dashboard` after onboarding.
2. Dashboard shows welcome message, subject cards, and a "Coming soon" diagnostic CTA.
3. Navigation bar is visible on all authenticated pages and NOT visible on unauthenticated pages.

### Acceptance Criteria

**AC-01 · Dashboard loads with correct subjects**
- Given a student who selected 2 AP subjects during onboarding
- When they reach the dashboard
- Then exactly those 2 subjects are shown as cards
- And each card shows the subject name and "Diagnostic not yet taken"

**AC-02 · Dashboard is protected**
- Given an unauthenticated user
- When they navigate to `/dashboard`
- Then they are redirected to `/signin`

**AC-03 · Navigation bar is visible on all authenticated pages**
- Given any authenticated student on any protected page
- When the page loads
- Then the navigation bar is visible with Dashboard, Practice, FRQ, and Profile links
- And it is NOT visible on unauthenticated pages (/signin, /signup, /verify-email, /forgot-password, etc.)

**AC-04 · Welcome message uses first name**
- Given a student whose first name is "Maria"
- When the dashboard loads
- Then the welcome message reads "Welcome back, Maria" (or equivalent)

**AC-05 · Empty state is handled gracefully**
- Given a student who has `onboarding_completed = true` but somehow has 0 enrolled subjects
- When the dashboard loads
- Then a message is shown: "Add an AP subject to get started" with a link to `/onboarding/subjects`

---

## S1-F-07 · Session Persistence & Sign-Out

**As a** student,
**I want** my session to persist across browser refreshes and tabs,
**so that** I do not need to sign in every time I open the app.

### Acceptance Criteria

**AC-01 · Session persists after refresh**
- Given a student who is signed in
- When they refresh the browser
- Then they remain signed in and the dashboard loads correctly

**AC-02 · Session persists across tabs**
- Given a student who is signed in on one tab
- When they open AceOS in a new tab
- Then they are automatically signed in without re-entering credentials

**AC-03 · Sign-out clears session**
- Given a signed-in student who clicks **Sign Out**
- When sign-out is processed
- Then the session token is revoked
- And they are redirected to `/signin`
- And attempting to navigate to `/dashboard` redirects back to `/signin`

**AC-04 · Expired session redirects to correct destination**
- Given a student whose session token has expired
- When they attempt to access any protected page
- Then they are redirected to `/signin` with a message: "Your session has expired. Please sign in again."
- And after signing in, the redirect destination is determined by account_status:
  - `active` + `onboarding_completed = true` → the page they tried to access (unless it was an `/onboarding/*` route, in which case → `/dashboard`)
  - `active` + `onboarding_completed = false` → `/onboarding/subjects`
  - `pending_consent` → `/onboarding/awaiting-consent`
  - `pending_age_check` → `/onboarding/consent`
  - `declined` → `/signin` with declined-account message (no redirect to product)

---

## S1-F-08 · Privacy Policy & Terms of Service Acceptance

**As a** student creating an account,
**I want to** read and accept the Privacy Policy and Terms of Service,
**so that** I understand how my data is used and consent to the platform rules.

> **Sprint 1 legal page strategy (Session 5 decision):** `/legal/privacy-policy` and `/legal/terms-of-service` will render placeholder pages in Sprint 1. Real FERPA-compliant content must be written and deployed **before launch (public beta)**. This is captured as a pre-launch blocker — see Open Actions below.

### User Flow
1. On the sign-up form, checkbox: "I agree to the [Privacy Policy] and [Terms of Service]" (links open in new tab).
2. Checkbox must be ticked before the form submits.
3. Acceptance is logged with timestamp and `document_version = "1.0"`.

### Acceptance Criteria

**AC-01 · Acceptance is required**
- Given a user who has not checked the ToS/Privacy Policy checkbox
- When they attempt to submit the sign-up form
- Then an error message appears: "You must accept the Privacy Policy and Terms of Service to continue"
- And the form does not submit

**AC-02 · Acceptance is logged**
- Given a user who accepts and successfully creates an account
- Then two records exist in `consent_log`: one for `tos_accepted` and one for `privacy_policy_accepted`
- And both records have `document_version = "1.0"` and a `created_at` timestamp

**AC-03 · Policy links are accessible**
- Given a user on the sign-up form
- When they click the Privacy Policy or Terms of Service link
- Then the correct page opens in a new tab (`/legal/privacy-policy` or `/legal/terms-of-service`)
- Without navigating away from the sign-up form

**AC-04 · Legal pages load without authentication**
- Given an unauthenticated user
- When they navigate to `/legal/privacy-policy` or `/legal/terms-of-service`
- Then the page loads and displays content (placeholder or real)
- And no sign-in redirect occurs

> ⚠️ **Pre-launch blocker:** Legal page content is placeholder in Sprint 1. Real FERPA-compliant Privacy Policy and ToS must be reviewed and deployed before any public or beta users are onboarded. See Open Pre-Launch Actions.

---

## S1-F-09 · Parental Consent Email Delivery

**As a** parent of an under-18 student,
**I want to** receive a clear consent email with an easy Approve/Decline action,
**so that** I can make an informed decision about my child's use of AceOS.

> **Sending address:** `onboarding@resend.dev` (Sprint 1). Custom domain deferred to Sprint 2.

### Email Content Requirements
- From: `onboarding@resend.dev`
- Subject: "Your approval is needed for [Student First Name]'s AceOS account"
- Body must include:
  - Student's first name
  - Brief description of what AceOS is (2–3 sentences)
  - Link to Privacy Policy
  - **Approve** button (prominent, above the fold)
  - **Decline** button/link
  - Expiry notice: "This link expires in 7 days"

### Acceptance Criteria

**AC-01 · Email is sent within 2 minutes**
- Given an under-18 student who submits the parental consent screen with a valid parent email
- When the form is submitted
- Then the consent email arrives in the parent's inbox within 2 minutes
- And is sent from `onboarding@resend.dev`

**AC-02 · Email content is correct**
- Given a consent email sent for student "Alex"
- Then the subject line contains "Alex"
- And the email body contains both an Approve and a Decline action
- And the Privacy Policy link is present and functional

**AC-03 · Approval link expires after 7 days**
- Given a parent consent link that is more than 7 days old
- When the parent clicks Approve
- Then they are shown: "This approval link has expired. [Student's first name] can log in and request a new one."
- And the student's account status remains `pending_consent`

**AC-04 · Approval link is single-use**
- Given a parent who has already clicked Approve
- When the same approval link is clicked again
- Then the page shows: "This link has already been used."
- And no duplicate state changes are made

---

## S1-F-10 · Account Recovery (Forgot Password)

**As a** student who has forgotten their password,
**I want to** reset it using my email address,
**so that** I can regain access to my account.

### User Flow
1. User clicks **Forgot password?** on `/signin`.
2. User enters their email address.
3. System sends a password reset link (via Supabase native email — not Resend).
4. User clicks the link, enters a new password, confirms it.
5. Password is updated. User is redirected to `/signin`.

### Acceptance Criteria

**AC-01 · Reset email is sent**
- Given a user who enters a registered email address on the forgot password form
- When they click **Send Reset Link**
- Then a password reset email is delivered within 2 minutes

**AC-02 · Unregistered email shows no account hint**
- Given a user who enters an email that does not exist in the system
- When they submit the form
- Then the same success message is shown: "If an account exists, we've sent a reset link"
- And no error reveals whether the email is registered

**AC-03 · Reset link expires after 1 hour**
- Given a reset link more than 1 hour old
- When the user clicks it
- Then they see: "This reset link has expired. Please request a new one."

**AC-04 · New password meets requirements**
- Given a user who submits a new password shorter than 8 characters or missing required character types
- When they attempt to save
- Then the specific password rule that failed is shown inline
- And the password is not updated

**AC-05 · Successful reset redirects to sign-in**
- Given a user who successfully sets a new password
- When the reset is processed
- Then they are redirected to `/signin` with a success banner: "Password updated. Please sign in."

---

## Open Pre-Launch Actions

> These are NOT Sprint 1 blockers. They are blockers for **public/beta launch**. Capture these now so they don't get lost.

| Action | Owner | Blocks |
|---|---|---|
| Write FERPA-compliant Privacy Policy (replace Sprint 1 placeholder) | Dhruv / Legal | Public launch |
| Write Terms of Service with minor provisions (replace Sprint 1 placeholder) | Dhruv / Legal | Public launch |
| Switch Resend sending domain to `hello@aceos.app` (DNS + verification) | Dhruv | Sprint 2 email upgrade |
| Create Google Cloud project + OAuth 2.0 credentials | Dhruv | S1-F-02 (Sprint 2) |

---

*Sprint 1 Functional Stories | AceOS Phase 1 · Epic 1 | April 2026 | Internal*
*Last updated: 2026-04-26 (Session 5) — G1: minor flow fixed. G2: resend + correct-email ACs added to S1-F-03. G3: legal placeholder strategy. G4: S1-F-07 AC-04 full redirect matrix. G5: /onboarding/* namespace guard. Pre-launch actions table added. Session 5 deliberation: S1-F-01 re-validated — AC-03b, AC-05b, AC-05c, AC-06 (expanded), AC-07 added. Test files: __tests__/api/auth/signup/*.*
