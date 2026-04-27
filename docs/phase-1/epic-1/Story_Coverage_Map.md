# Story Coverage Map
## Epic 1: Foundation & Legal | Phase 1: ScoreBoost AP | Sprint 1

> **How to use this file:**
> Before picking up any functional story, find it in this table and read every linked technical story first.
> Before marking a functional story as done, verify every acceptance criterion in the linked technical story is met.
> Update `Status` columns at the end of every session.

---

## Functional → Technical Story Mapping

| Functional Story | Priority | Technical Story(ies) | Coverage | Functional Status | Technical Status |
|---|---|---|---|---|---|
| S1-F-01 · Email Sign-Up | P0 | T1.1, T1.4 | ✅ Full | ✅ Done | ⚠️ Needs validation |
| S1-F-02 · Google OAuth Sign-Up & Sign-In | P0 → **Sprint 2** | T1.4b (written, descoped) | ✅ Full | ⏸ Descoped to Sprint 2 | ⏸ Written — needs pre-impl checklist done |
| S1-F-03 · Age Gate & Parental Consent Flow | P0 | T1.4, T1.12 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-04 · Email Verification | P0 | T1.4, T1.12 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-05 · Student Onboarding: AP Subject Selection | P0 | T1.1, T1.5 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-06 · Student Dashboard Shell | P0 | T1.10 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-07 · Session Persistence & Sign-Out | P0 | T1.9 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-08 · Privacy Policy & ToS Acceptance | P0 | T1.6, T1.4 | ✅ Full | ⚠️ Partial | ✅ Written |
| S1-F-09 · Parental Consent Email Delivery | P0 | T1.4, T1.12 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-10 · Account Recovery (Forgot Password) | P1 | T1.11 | ✅ Full | 🔲 Not started | ✅ Written |

---

## Cross-Cutting Technical Stories

| Technical Story | Applies To | Status |
|---|---|---|
| T1.1 · Schema Bootstrap | All DB stories | ✅ Live — `students`, `consent_log`, `auth_event_log`, `student_subjects` (normalized FK), `subjects`, `products` all applied to DB |
| T1.2 · Vercel Deployment Pipeline | All stories | ✅ Done |
| T1.3 · LiteLLM Gateway | Sprint 2+ only | 🔲 Not started |
| T1.8 · Error Boundary & Graceful Degradation | S1-F-01, 03, 04, 05, 06, 07, 10 | 🔲 Not started |

---

## 📦 Canonical Implementation Order

> Follow this order. Do not start a story until all stories above it that it depends on are complete.

```
1. ✅ DONE     — T1.2  Vercel pipeline
2. ⚠️ VALIDATE — S1-F-01  Validate implementation against T1.1 + T1.4 (checklist below)
                              NOTE (Session 8): signup route now aligned to live DB.
                              Run DB validation to confirm.
3. 🔲 NEXT     — S1-F-04 + S1-F-09  Wire Resend (email verification + parental consent email)
                              Branch: feat/s1-f04-s1-f09-email
                              NOTE: generateLink → Resend handoff lives in
                              app/api/auth/signup/route.ts — code aligned to live schema.
                              Supabase Auth email sending must be disabled in the dashboard.
4. 🔲         — S1-F-03  Age gate UI — depends on Resend being wired (step 3) and T1.12 pages
                              Also build: /onboarding/consent + /onboarding/awaiting-consent (T1.12)
5. 🔲         — S1-F-08  Legal pages — unblocked, no external dependencies
                              Build: /legal/privacy-policy + /legal/terms-of-service (T1.6)
6. 🔲         — S1-F-05  Subject selection — student_subjects table exists (normalized FK model)
                              Seed subjects + products tables before building UI
7. 🔲         — S1-F-07  Session persistence + sign-out — can run parallel with step 6 (T1.9)
8. 🔲         — S1-F-06  Dashboard shell — depends on S1-F-05 for subject data (T1.10)
                              Also build: (protected) route group layout with NavBar
9. 🔲         — T1.8  Error boundaries — implement cross-cutting after P0 stories done
10. 🔲        — S1-F-10  Forgot password (P1 — implement if time permits after step 8)
11. ⏸          — S1-F-02  Google OAuth (Sprint 2 — complete pre-impl checklist in T1.4b first)
```

---

## S1-F-01 Validation Checklist

> **Action required:** S1-F-01 is marked Done but was implemented before technical stories were fully written. Validate each AC below before moving to step 3.
> **Session 8 note:** signup route patched to match live schema. Checklist updated to reflect two-log architecture.

### Against T1.1 (Schema)

| Check | AC | Expected | Validated? |
|---|---|---|---|
| `students` row shape correct | T1.1 Scenario 3 | id, email, first_name, last_name, dob, account_status, email_verified, onboarding_completed | 🔲 |
| `account_status` CHECK constraint in place | T1.1 Scenario 4 | Rejects values outside allowed set | 🔲 |
| `consent_log` document_type constraint in place | T1.1 Scenario 5 | Rejects values outside ('terms_of_service', 'privacy_policy') | 🔲 |
| `auth_event_log` event_type constraint in place | T1.1 (new) | Rejects invalid event_type values | 🔲 |
| RLS on `students` table enabled | T1.1 Scenario 1 | Cross-user query returns empty | 🔲 |
| RLS on `consent_log` blocks client reads | T1.1 Scenario 2 | Client query returns 0 rows | 🔲 |
| RLS on `auth_event_log` blocks client reads | T1.1 (new) | Client query returns 0 rows | 🔲 |

### Against T1.4 (Auth)

| Check | AC | Expected | Validated? |
|---|---|---|---|
| Adult signup sets account_status = 'active' | T1.4 Scenario 1 | DB value confirmed | 🔲 |
| Adult signup writes 2 consent_log rows (legal docs only) | T1.4 two-log rule | document_type='terms_of_service' version='1.0' AND document_type='privacy_policy' version='1.0' | 🔲 |
| Adult signup writes 1 auth_event_log row | T1.4 (new, Session 8) | event_type='age_verified_adult' in auth_event_log — NOT in consent_log | 🔲 |
| No extraneous columns written to consent_log | T1.4 (new, Session 8) | Columns event_type, document_version, actor_email do NOT exist — verify no insert error | 🔲 |
| Minor signup sets account_status = 'pending_age_check' | T1.4 Scenario 2 | DB value confirmed | 🔲 |
| Minor signup writes 2 consent_log rows, 0 auth_event_log rows | T1.4 (new) | Legal docs written; no age_verified_adult row (minor, not adult) | 🔲 |
| Minor signup redirects to /verify-email (NOT /onboarding/consent) | T1.4 Scenario 2 | All users go to /verify-email first; /onboarding/consent comes after email verification | 🔲 |
| generateLink called and action_link passed to Resend | T1.4 Scenario (Session 7) | supabase.auth.admin.generateLink called; properties.action_link passed to Resend; Supabase auto-send disabled | 🔲 |
| Rollback deletes auth user on students insert failure | T1.4 Scenario 3 | No orphaned auth.users row | 🔲 |
| Duplicate email returns 409 + EMAIL_ALREADY_EXISTS | T1.4 Scenario 4 | HTTP 409, structured error body | 🔲 |
| Redirect lands on /verify-email for adults | S1-F-01 AC-01 | URL confirmed in browser | 🔲 |

---

## Open Pre-Implementation Actions (before Sprint 2)

| Action | Owner | Blocks |
|---|---|---|
| Decide Resend sending domain (`onboarding@resend.dev` vs `hello@aceos.app`) | Dhruv | S1-F-04, S1-F-09 |
| Disable Supabase Auth email sending in dashboard (Auth → Settings) | Dhruv | S1-F-04 — required before generateLink → Resend handoff works correctly |
| Seed `subjects` + `products` tables in DB | Dhruv | S1-F-05 |
| Create Google Cloud project + OAuth 2.0 credentials (see T1.4b checklist) | Dhruv | S1-F-02 (Sprint 2) |
| Write FERPA-compliant Privacy Policy text | Dhruv / Legal | S1-F-08 / T1.6 |
| Write Terms of Service text | Dhruv / Legal | S1-F-08 / T1.6 |

---

## Status Key

| Symbol | Meaning |
|---|---|
| ✅ Done | Complete and verified |
| ⚠️ Partial / Needs validation | Started but not complete or not yet verified |
| 🔲 Not started | No work done yet |
| ⏴ Blocked | Cannot proceed until dependency resolved |
| ⏸ Descoped | Intentionally deferred to next sprint |

---

## Session Log

| Session | Date | Stories Completed | Notes |
|---|---|---|---|
| Session 1 | 2026-04 | T1.2, S1-F-01 (partial) | Infrastructure setup, Vercel pipeline |
| Session 2 | 2026-04-26 | S1-F-01 (done), PR #3 merged | Signup flow E2E, middleware tests |
| Session 3 | 2026-04-26 | — | Schema drift resolved. T1.1, T1.4 updated. T1.7 superseded. T1.9, T1.10, T1.11 written. Coverage map created. |
| Session 4 | 2026-04-26 | — | Agent review: 8 gaps found and fixed. T1.4b written + descoped. T1.12 written (new). T1.1 mastery_data added. T1.5 max-4 fixed. T1.9 redirect guard added. T1.10 protected route group specced. T1.4 document_version convention defined. Implementation order documented. |
| Session 5 | 2026-04-26 | — | PSE × PPM deliberation on S1-F-01. AC-03b, AC-05b, AC-05c, AC-06 (expanded), AC-07 added. Minor flow corrected: email verify first, then consent. T1.4 state machine updated (G1). T1.6 placeholder strategy added (G3). T1.9 full redirect matrix + declined rule (G4, G9). T1.10 /onboarding/* namespace guard (G5). T1.1 parent_email column (G6). T1.4 approve/deny routes specced (G7). T1.1 consent_log index (G8). T1.4 race guard (G10). CONSENT_JWT_SECRET separated. |
| Session 6 | 2026-04-26 | — | PSE × PPM deliberation on S1-F-03. AC-01b added (pending_age_check → pending_consent transition). AC-03 updated (Decline link — COPPA requirement). AC-03b added (server-side parent email validation). AC-07 rewritten (FERPA hard-delete, explicit deleteUser). AC-09b added (parent_email overwrite). |
| Session 7 | 2026-04-27 | — | S1-F-04 generateLink → Resend handoff specced. Supabase migration `add_auth_event_log` applied: auth_event_log table + enum created, RLS applied, consent_log RLS tightened. Session 7 handoff doc created. |
| Session 8 | 2026-04-27 | — | signup route patched: consent_log now uses document_type/version/accepted_at (live columns); age_verified_adult moved to auth_event_log. T1.1 schema section synced: two-log architecture, normalized student_subjects FK model, subjects + products tables added. T1.4 state machine synced: all lifecycle events route to correct table. Coverage Map validation checklist updated for two-log architecture. |

---

*Story Coverage Map | AceOS Phase 1 · Epic 1 | Last updated: 2026-04-27 (Session 8)*
