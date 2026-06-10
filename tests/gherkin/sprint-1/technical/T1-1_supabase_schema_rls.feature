# Story: T1-1 — Supabase SIP v0 Schema & RLS
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Integration (primary)
# Story Source: docs/AceOS_Claude_roadmap v1.0.md
# Last Updated: 2026-06-09

# Automation Map:
# Scenario 1 → tests/integration/supabase/sip.test.ts → 'Unauthorized user cannot read SIP data'
# Scenario 2 → tests/integration/supabase/sip.test.ts → 'Authorized user can read their own SIP data'
# Scenario 3 → tests/integration/supabase/sip.test.ts → 'Authorized user cannot read other students' SIP data'

Feature: Supabase SIP v0 Schema & Row Level Security

  As an AceOS developer
  I want the core Student Intelligence Profile (SIP) table to be defined
  And have Row Level Security (RLS) policies enforced
  So that student data is secure and compliant with FERPA from Day 1

  Scenario: Unauthorized user cannot read SIP data
    Given the database contains a student intelligence profile
    And the user is not authenticated
    When an attempt is made to read any SIP data
    Then the attempt should be denied

  Scenario: Authorized user can read their own SIP data
    Given the database contains a student intelligence profile for a specific student
    And the user is authenticated as that specific student
    When an attempt is made to read that student's SIP data
    Then the attempt should succeed and return only that student's data

  Scenario: Authorized user cannot read other students' SIP data
    Given the database contains student intelligence profiles for multiple students
    And the user is authenticated as Student A
    When an attempt is made to read Student B's SIP data
    Then the attempt should be denied
