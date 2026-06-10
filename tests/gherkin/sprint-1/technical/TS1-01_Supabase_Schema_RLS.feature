# Automation Mapping:
# - Given: Supabase instance exists but no schema
# - When: Migration runs (supabase/migrations/20260610000000_init_schema.sql)
# - Then: Tables created, RLS policies enforced, verified via test query
# Unit tests: tests/unit/supabase-schema.test.ts (verify schema introspection)
# Integration: tests/integration/supabase/rls-policies.test.ts (test RLS enforcement)

Feature: Supabase Database Schema and Row-Level Security
  As a developer
  I want a properly designed database schema with enforced RLS
  So that student data is protected and FERPA-compliant

  Background:
    Given a fresh Supabase instance is provisioned
    And the Supabase service key is available for migrations
    And we are deploying to production standards (encryption, audit logging)

  Scenario: Core tables are created with correct columns
    When the initial migration runs
    Then the following tables exist:
      | Table | Key Columns |
      | users | id (uuid), email (encrypted), password_hash, created_at |
      | students | id (uuid), user_id (FK users), date_of_birth (encrypted), school (nullable) |
      | user_ap_subjects | id (uuid), user_id (FK), ap_subject_id (FK) |
      | sip_records | id (uuid), student_id (FK students), subject (text), mastery (float) |
      | parental_consent_requests | id (uuid), student_id (FK), parent_email (encrypted), status (enum) |
      | audit_logs | id (uuid), user_id (FK), action (text), timestamp |

  Scenario: users table has correct indexes and constraints
    When the users table is created
    Then:
      - id is the primary key (UUID)
      - email has a UNIQUE constraint
      - email is encrypted using pgcrypto or Vault
      - created_at has a DEFAULT value of NOW()
      - email and other PII are TEXT fields (stored encrypted)

  Scenario: students table links to users and has FERPA protections
    When the students table is created
    Then:
      - student_id is the primary key (UUID)
      - user_id is a FOREIGN KEY to users.id (ON DELETE CASCADE)
      - date_of_birth is encrypted
      - All student PII columns have encryption applied
      - RLS policy: students can SELECT only their own record
      - RLS policy: parents can SELECT only with active parental_consent

  Scenario: user_ap_subjects links students to AP courses
    When the user_ap_subjects table is created
    Then:
      - id is the primary key (UUID)
      - user_id is a FOREIGN KEY to users.id
      - ap_subject_id references a lookup table ap_subjects (AP Chemistry, AP Biology, etc.)
      - created_at tracks when the subject was added
      - RLS policy: students see only their own subject selections
      - RLS policy: no bulk exports of student subjects are possible

  Scenario: sip_records stores Student Intelligence Profile data
    When the sip_records table is created
    Then:
      - id is the primary key (UUID)
      - student_id is a FOREIGN KEY to students.id
      - ap_subject (text): name of the AP subject
      - mastery (float): decimal 0.0–1.0
      - last_reviewed (timestamp): when the mastery was last updated
      - fsrs_due (timestamp): next review due date (for spaced repetition)
      - updated_at (timestamp): when this record was last changed
      - RLS policy: students see only their own SIP data
      - RLS policy: parents see only their consented child's SIP

  Scenario: parental_consent_requests table tracks consent workflow
    When the parental_consent_requests table is created
    Then:
      - id is the primary key (UUID)
      - student_id is a FOREIGN KEY to students.id
      - parent_email (encrypted): the parent's email
      - status (enum): pending, approved, rejected, expired
      - created_at (timestamp): when the request was sent
      - expires_at (timestamp): when consent request expires (30 days)
      - approved_at (nullable timestamp): when parent approved
      - RLS policy: students see only requests they initiated
      - RLS policy: parents can only approve/reject with matching email

  Scenario: audit_logs table records all sensitive operations
    When the audit_logs table is created
    Then:
      - id is the primary key (UUID)
      - user_id is a FOREIGN KEY to users.id
      - action (text): "signup", "subject_selected", "consent_approved", "sip_updated"
      - timestamp (default NOW()): when the action occurred
      - ip_address (nullable): for security auditing
      - details (jsonb): additional context (encrypted)
      - RLS policy: users can see only their own audit logs
      - RLS policy: admins can query all logs (with additional auth check)

  Scenario: All RLS policies are enabled and enforced
    When all tables are created
    Then:
      - ALTER TABLE ... ENABLE ROW LEVEL SECURITY is applied to all tables
      - No table allows unrestricted SELECT, UPDATE, or DELETE without policies
      - RLS policies use authenticated_uid to determine ownership
      - Test queries verify students cannot see other students' data:
        | Test | Expected Result |
        | SELECT * FROM sip_records WHERE user_id != current_user_id | Returns 0 rows |
        | SELECT * FROM parental_consent_requests WHERE student_id != current_user_id | Returns 0 rows |
        | UPDATE sip_records SET mastery = 1.0 WHERE user_id != current_user_id | Raises permission denied |

  Scenario: Foreign key constraints prevent orphaned records
    When records are inserted
    Then:
      - Inserting a student without a valid user_id is rejected
      - Inserting an sip_record without a valid student_id is rejected
      - Deleting a user cascades to delete their student, subjects, and SIP records
      - Audit logs record all deletions

  Scenario: Database performance: indexes are created on common queries
    When the schema is deployed
    Then indexes exist on:
      - users.email (for login queries)
      - students.user_id (for foreign key lookups)
      - sip_records.student_id, ap_subject (for daily queue queries)
      - parental_consent_requests.student_id, parent_email
      - audit_logs.user_id, timestamp (for audit trail queries)
