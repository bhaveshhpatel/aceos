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
| S1-F-02 · Google OAuth Sign-Up & Sign-In | P0 | T1.4b (not yet written) | ⚠️ Partial | 🔲 Not started | 🔲 Not started |
| S1-F-03 · Age Gate & Parental Consent Flow | P0 | T1.4 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-04 · Email Verification | P0 | T1.4 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-05 · Student Onboarding: AP Subject Selection | P0 | T1.5 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-06 · Student Dashboard Shell | P0 | T1.10 | ✅ Full | 🔲 Not started | ✅ Written (new) |
| S1-F-07 · Session Persistence & Sign-Out | P0 | T1.9 | ✅ Full | 🔲 Not started | ✅ Written (new) |
| S1-F-08 · Privacy Policy & ToS Acceptance | P0 | T1.6 (pages), T1.4 (checkbox + consent_log) | ✅ Full | ⚠️ Partial | ✅ Written |
| S1-F-09 · Parental Consent Email Delivery | P0 | T1.4 | ✅ Full | 🔲 Not started | ✅ Written |
| S1-F-10 · Account Recovery (Forgot Password) | P1 | T1.11 | ✅ Full | 🔲 Not started | ✅ Written (new) |

---

## Cross-Cutting Technical Stories

These technical stories apply to multiple functional stories and should be referenced throughout implementation:

| Technical Story | Applies To | Status |
|---|---|---|
| T1.1 · Schema Bootstrap | All stories that touch the DB | ⚠️ Partial (students + consent_log exist; student_subjects not yet created) |
| T1.2 · Vercel Deployment Pipeline | All stories | ✅ Done |
| T1.3 · LiteLLM Gateway | Sprint 2+ only | 🔲 Not started |
| T1.8 · Error Boundary & Graceful Degradation | S1-F-01, 03, 04, 05, 06, 07, 10 | 🔲 Not started |

---

## S1-F-01 Validation Checklist

> **Action required this session:** S1-F-01 is marked Done but was implemented before the technical stories were fully written. Validate each AC below against the actual implementation before moving to S1-F-04.

### Against T1.1 (Schema)

| Check | AC | Expected | Validated? |
|---|---|---|---|
| `students` row shape correct | T1.1 Scenario 3 | id, email, first_name, last_name, dob, account_status, email_verified, onboarding_completed | 🔲 |
| `account_status` CHECK constraint in place | T1.1 Scenario 4 | Rejects values outside allowed set | 🔲 |
| `consent_log` event_type constraint in place | T1.1 Scenario 5 | Rejects invalid event_type | 🔲 |
| RLS on `students` table enabled | T1.1 Scenario 1 | Cross-user query returns empty | 🔲 |
| RLS on `consent_log` blocks client reads | T1.1 Scenario 2+3 | Client query returns 0 rows | 🔲 |

### Against T1.4 (Auth)

| Check | AC | Expected | Validated? |
|---|---|---|---|
| Adult signup sets account_status = 'active' | T1.4 Scenario 1 | DB value confirmed | 🔲 |
| Adult signup inserts 3 consent_log rows | T1.4 Scenario 1 | tos_accepted, privacy_policy_accepted, age_verified_adult | 🔲 |
| Minor signup sets account_status = 'pending_age_check' | T1.4 Scenario 2 | DB value confirmed | 🔲 |
| Minor signup redirects to /onboarding/consent | T1.4 Scenario 2 | Not /verify-email | 🔲 |
| Rollback deletes auth user on students insert failure | T1.4 Scenario 3 | No orphaned auth.users row | 🔲 |
| Duplicate email returns 409 + EMAIL_ALREADY_EXISTS | T1.4 Scenario 4 | HTTP 409, structured error body | 🔲 |
| Redirect lands on /verify-email for adults | S1-F-01 AC-01 | URL confirmed in browser | 🔲 |

---

## Status Key

| Symbol | Meaning |
|---|---|
| ✅ Done | Complete and verified |
| ⚠️ Partial | Started but not complete |
| 🔲 Not started | No work done yet |
| ⛔ Blocked | Cannot proceed until dependency resolved |

---

## Session Log

| Session | Date | Stories Completed | Notes |
|---|---|---|---|
| Session 1 | 2026-04 | T1.2, S1-F-01 (partial) | Infrastructure setup, Vercel pipeline |
| Session 2 | 2026-04-26 | S1-F-01 (done), PR #3 merged | Signup flow E2E, middleware tests |
| Session 3 | 2026-04-26 | — | Schema drift resolved. T1.1, T1.4 updated. T1.7 superseded. T1.9, T1.10, T1.11 written. Coverage map created. S1-F-01 validation queued. |

---

*Story Coverage Map | AceOS Phase 1 · Epic 1 | Last updated: 2026-04-26 (Session 3)*
