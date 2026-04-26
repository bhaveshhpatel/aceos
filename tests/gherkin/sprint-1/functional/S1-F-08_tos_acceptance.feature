# Story: S1-F-08 — Privacy Policy & Terms of Service Acceptance
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/signup.spec.ts → 'unchecked ToS blocks submission'
# Scenario 2 → tests/integration/db/consent.test.ts → 'acceptance logged with version'
# Scenario 3 → tests/e2e/auth/signup.spec.ts → 'policy links accessible from signup'

Feature: Privacy Policy & Terms of Service Acceptance
  As a student creating an account
  I want to read and accept the Privacy Policy and Terms of Service
  So that I understand how my data is used

  Scenario: Unchecked ToS checkbox blocks form submission
    Given a user on the signup form who has filled all fields
    But they have not checked the ToS/Privacy Policy checkbox
    When they attempt to submit the signup form
    Then the error "You must accept the Privacy Policy and Terms of Service to continue" appears
    And the form does not submit

  Scenario: ToS and Privacy Policy acceptance is logged with timestamp and version
    Given a user who checks the ToS checkbox and successfully creates an account
    Then a record exists in consent_audit_log with the student_id
    And the record includes document_type and accepted_at timestamp
    And the record includes the document version number

  Scenario: Privacy Policy and ToS links open without leaving the signup form
    Given a user on the signup form
    When they click the Privacy Policy link
    Then the Privacy Policy opens in a new tab or modal
    And the signup form remains intact with their entered data
    When they click the Terms of Service link
    Then the Terms of Service opens in a new tab or modal
