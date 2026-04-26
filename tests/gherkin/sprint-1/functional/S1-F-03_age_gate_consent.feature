# Story: S1-F-03 — Age Gate & Parental Consent Flow
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/consent.spec.ts → 'minor is gated at consent screen'
# Scenario 2 → tests/e2e/auth/consent.spec.ts → 'adult bypasses consent'
# Scenario 3 → tests/integration/email/consent-email.test.ts → 'consent email sent within 2 min'
# Scenario 4 → tests/e2e/auth/consent.spec.ts → 'invalid parent email rejected'
# Scenario 5 → tests/integration/api/auth.test.ts → 'parent approval activates account'
# Scenario 6 → tests/e2e/auth/consent.spec.ts → 'unapproved minor blocked from dashboard'
# Scenario 7 → tests/integration/api/auth.test.ts → 'parent decline soft-deletes account'

Feature: Age Gate & Parental Consent Flow
  As a student under 18
  I want my signup to trigger a parental consent gate
  So that AceOS is FERPA-compliant before storing any of my data

  Scenario: Student under 18 is shown consent screen and blocked from dashboard
    Given a student signs up with a date of birth 15 years ago
    And they provide parent email "parent@example.com"
    When signup completes
    Then the student sees the parental consent waiting screen
    And profiles.parental_consent_status = 'pending'
    And the student cannot access /dashboard
    And navigating to /dashboard redirects to the consent waiting screen

  Scenario: Student 18 or older bypasses consent and goes to subject selection
    Given a student signs up with a date of birth 20 years ago
    When signup completes
    Then profiles.parental_consent_status = 'not_required'
    And consent_audit_log has one record with event_type = 'age_verified_adult'
    And the student is redirected to /onboarding/subject-select

  Scenario: Consent email is sent to parent within 2 minutes
    Given an under-18 student provides parent email "parent@example.com"
    When the parental consent screen is submitted
    Then a consent email is sent to "parent@example.com" within 2 minutes
    And the email contains an Approve link with a valid signed JWT token
    And the email contains a Decline link

  Scenario: Invalid parent email is rejected with inline error
    Given an under-18 student is on the parental consent screen
    When they submit with parent email "not-an-email"
    Then the form shows "Please enter a valid email address for your parent or guardian"
    And no email is sent
    And profiles.parental_consent_status remains 'pending'

  Scenario: Parent approval unblocks student account
    Given a minor student has parental_consent_status = 'pending'
    When the parent clicks the Approve link in the consent email
    Then profiles.parental_consent_status = 'granted'
    And consent_audit_log has a record with event_type = 'consent_granted'
    And the student receives a confirmation email
    And the student can now access /dashboard after next sign-in

  Scenario: Unapproved minor cannot access any product feature
    Given a student with parental_consent_status = 'pending'
    When they navigate to /dashboard, /practice, or /frq
    Then they are redirected to the consent waiting screen
    And no product data is loaded or displayed

  Scenario: Parent denial soft-deletes student account
    Given a minor student has parental_consent_status = 'pending'
    When the parent clicks the Decline link in the consent email
    Then profiles.parental_consent_status = 'denied'
    And the auth.users record is deleted
    And no student data remains in any table
    And the student receives an email explaining their account could not be activated
