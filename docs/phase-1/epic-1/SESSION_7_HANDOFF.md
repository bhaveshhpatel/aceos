# Session 7 Handoff
## AceOS | Phase 1 | Epic 1 | Sprint 1

**Repository:** `bhaveshhpatel/aceos`
**Supabase project:** `olybgkhggqnmrfcjjojy` (`aceos`, `us-west-1`, `ACTIVE_HEALTHY`)
**Vercel team:** `team_l3iMfKjPASqWNF9xRrIVPuWt` (`bhaveshhpatel's projects`)

---

## Completed This Session

### GitHub commits pushed
| Commit | Description |
|---|---|
| `ccd6471` | S1-F-01 / S1-F-04 boundary correction in functional stories |
| `6197b4b` | T1.4 updated to explicitly document `generateLink → properties.action_link → Resend` |
| `e4d2e9c` | Coverage Map corrected, Sessions 5–7 added to session log |
| `11b94a3` | signup route fixed: `magiclink → signup`, extracts `action_link`, sends via Resend, rollback added |

### Supabase migration applied
**Migration name:** `add_auth_event_log`

**What it did:**
- Created enum `auth_event_type` with values:
  - `age_verified_adult`
  - `email_verified`
  - `consent_email_sent`
  - `consent_granted`
  - `consent_denied`
  - `consent_revoked`
- Created table `auth_event_log`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE`
  - `event_type auth_event_type NOT NULL`
  - `actor_email TEXT`
  - `ip_address TEXT`
  - `user_agent TEXT`
  - `metadata JSONB DEFAULT '{}'`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Added index `idx_auth_event_log_student_id`
- Enabled RLS on `auth_event_log`
- Added policy `auth_event_log_insert_service_only`
- Added policy `auth_event_log_no_client_read`
- Fixed `consent_log` RLS:
  - Dropped `consent_log_select_own`
  - Added `consent_log_no_client_read`
  - Replaced loose insert policy with `consent_log_insert_service_only`

---

## Live DB Canonical Model (Source of Truth)

### students
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `email` | text | NO |
| `first_name` | text | NO |
| `last_name` | text | NO |
| `dob` | date | YES |
| `account_status` | enum `account_status` | NO |
| `email_verified` | boolean | NO |
| `onboarding_completed` | boolean | NO |
| `parent_email` | text | YES |
| `consent_token` | text | YES |
| `consent_token_expires_at` | timestamptz | YES |
| `created_at` | timestamptz | NO |
| `updated_at` | timestamptz | NO |

### consent_log — legal document acceptance ONLY
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `student_id` | uuid | NO |
| `document_type` | enum `consent_document_type` | NO |
| `version` | text | NO (default `'1.0'`) |
| `accepted_at` | timestamptz | NO |
| `ip_address` | text | YES |
| `user_agent` | text | YES |

### auth_event_log — auth lifecycle events ONLY (new this session)
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `student_id` | uuid | NO |
| `event_type` | enum `auth_event_type` | NO |
| `actor_email` | text | YES |
| `ip_address` | text | YES |
| `user_agent` | text | YES |
| `metadata` | jsonb | YES |
| `created_at` | timestamptz | NO |

### student_subjects — normalized enrollment join table
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `student_id` | uuid | NO |
| `subject_id` | uuid (FK → subjects) | NO |
| `product_id` | uuid (FK → products) | NO |
| `enrolled_at` | timestamptz | NO |

### subjects
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `slug` | text | NO |
| `name` | text | NO |
| `description` | text | YES |
| `icon_name` | text | YES |
| `active` | boolean | NO |
| `sort_order` | integer | NO |
| `product_id` | uuid (FK → products) | NO |

### products
| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `slug` | text | NO |
| `name` | text | NO |
| `description` | text | YES |
| `is_active` | boolean | NO |
| `phase` | smallint | NO |
| `created_at` | timestamptz | NO |

---

## Critical Remaining Gap

### `app/api/auth/signup/route.ts` is broken against the live DB

**Current bug:** The route still inserts into `consent_log` using columns that do not exist:
- `event_type` ← does not exist
- `document_version` ← does not exist
- `actor_email` ← does not exist in consent_log

**Required fix — Step 1:** Write legal acceptance to `consent_log` using the live schema:

```ts
await supabase.from('consent_log').insert([
  {
    student_id: userId,
    document_type: 'terms_of_service',
    version: '1.0',
    accepted_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: ua,
  },
  {
    student_id: userId,
    document_type: 'privacy_policy',
    version: '1.0',
    accepted_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: ua,
  },
]);
```

**Required fix — Step 2:** Write adult lifecycle event to `auth_event_log`:

```ts
if (accountStatus === 'active') {
  await supabase.from('auth_event_log').insert({
    student_id: userId,
    event_type: 'age_verified_adult',
    actor_email: email,
    ip_address: ip,
    user_agent: ua,
  });
}
```

---

## Docs Still Needing Sync

### `docs/phase-1/epic-1/Sprint_1_Technical_Stories.md`
- T1.1 schema section still describes old denormalized `student_subjects` with `subject_code`, `subject_name`, `exam_date`, `mastery_data JSONB` — must be replaced with normalized FK model
- T1.1 `consent_log` section still describes event-log shape — must reflect legal-doc-acceptance-only shape
- T1.4 state machine still references `consent_log` for lifecycle events — must be split:
  - legal acceptance → `consent_log`
  - auth lifecycle events → `auth_event_log`

### `docs/phase-1/epic-1/Story_Coverage_Map.md`
- Validation checklist rows for `consent_log` must reflect live schema
- New validation row needed for `auth_event_log`
- Session 8 row to be added when next session completes

---

## Safe Next Patch Order

1. Read `app/api/auth/signup/route.ts` from GitHub
2. Patch signup route to use live `consent_log` + new `auth_event_log` schema
3. Read `Sprint_1_Technical_Stories.md` from GitHub
4. Patch T1.1 and T1.4 to describe two-log architecture and normalized `student_subjects`
5. Read `Story_Coverage_Map.md` from GitHub
6. Patch Coverage Map validation checklist
7. Re-run DB validation for S1-F-01 against updated code

---

## Resume Instruction for Next Chat

Paste this at the top of the new thread:

> We're continuing AceOS Sprint 1 from the Session 7 handoff doc (`docs/phase-1/epic-1/SESSION_7_HANDOFF.md`). The DB is patched with `auth_event_log` and corrected RLS. The signup route still writes wrong columns to `consent_log` and must be aligned to the live schema. Then T1.1 / T1.4 / Coverage Map need live-DB sync. GitHub, Supabase, and Vercel connectors are attached. Start by reading the current signup route from GitHub and push the fix.

---

*Generated: 2026-04-27 | Session 7 | AceOS v1.0*
