# Story: TS1-01 — Supabase Schema & RLS Policies
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Integration (primary) — real Supabase test schema
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/integration/db/schema.test.ts → 'student_profiles table exists with correct columns'
# Scenario 2 → tests/integration/db/rls.test.ts → 'anon role cannot read student_profiles'
# Scenario 3 → tests/integration/db/rls.test.ts → 'student can only read own profile'
# Scenario 4 → tests/integration/db/rls.test.ts → 'parental_consent_verified blocks dashboard data'
# Scenario 5 → tests/integration/db/schema.test.ts → 'SIP mastery_map JSONB default is empty object'
# Scenario 6 → tests/integration/db/triggers.test.ts → 'signup creates student_profiles row automatically'

Feature: Supabase Schema & Row Level Security
  As the platform
  I need a correctly structured database with RLS
  So that student data is isolated, secure, and FERPA-compliant from day one

  Background:
    Given the test Supabase schema is migrated and clean
    And there are two test students: "student-a" and "student-b"
    And "student-a" has parental_consent_verified = false
    And "student-b" has parental_consent_verified = true

  Scenario: student_profiles table has all required SIP columns
    Given the database migration has run
    When the schema for "student_profiles" is inspected
    Then it has column "id" of type UUID and is the primary key
    And it has column "ap_subjects" of type TEXT ARRAY
    And it has column "mastery_map" of type JSONB with default value '{}'
    And it has column "predicted_ap_scores" of type JSONB with default value '{}'
    And it has column "parental_consent_verified" of type BOOLEAN with default false
    And it has column "date_of_birth" of type DATE
    And it has column "created_at" of type TIMESTAMPTZ with default now()

  Scenario: Anonymous users cannot read any row in student_profiles
    Given an unauthenticated (anon) database connection
    When a SELECT query runs against "student_profiles"
    Then zero rows are returned
    And no error is thrown (RLS silently filters, not rejects)

  Scenario: A student can only read their own profile row
    Given a database connection authenticated as "student-a"
    When a SELECT query runs against "student_profiles" with no WHERE clause
    Then exactly one row is returned
    And the returned row has id matching "student-a"
    And no row for "student-b" is returned

  Scenario: A student cannot write to another student's profile row
    Given a database connection authenticated as "student-a"
    When an UPDATE query targets the row with id of "student-b"
    Then the update affects zero rows
    And no error is thrown (RLS silently blocks)

  Scenario: Student with unverified parental consent cannot read dashboard tables
    Given a database connection authenticated as "student-a"
    And "student-a" has parental_consent_verified = false
    When a SELECT query runs against "study_sessions"
    Then zero rows are returned
    And no 500 error is thrown

  Scenario: New auth.users signup automatically creates a student_profiles row
    Given the database has a trigger on auth.users INSERT
    When a new user row is inserted into auth.users with id "new-uuid"
    Then a corresponding row exists in student_profiles with id "new-uuid"
    And mastery_map is '{}'
    And parental_consent_verified is false
