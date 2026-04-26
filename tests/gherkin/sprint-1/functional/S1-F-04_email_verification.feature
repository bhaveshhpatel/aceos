# Story: S1-F-04 — Email Verification
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/email-verification.spec.ts → 'verification link activates account'
# Scenario 2 → tests/e2e/auth/email-verification.spec.ts → 'expired link shows resend option'
# Scenario 3 → tests/e2e/auth/email-verification.spec.ts → 'unverified user blocked from features'
# Scenario 4 → tests/integration/email/verification.test.ts → 'resend invalidates previous link'

Feature: Email Verification
  As a student who signed up with email
  I want to verify my email address
  So that I can confirm I own the address and protect my account

  Scenario: Valid verification link activates account and redirects to next step
    Given a student has signed up but not yet verified their email
    When they click the verification link in the email
    Then profiles.email_verified is set to true
    And if the student is under 18 they are redirected to the age gate
    And if the student is 18 or older they are redirected to /onboarding/subject-select

  Scenario: Expired verification link shows resend option
    Given a verification link that is more than 24 hours old
    When the student clicks it
    Then they see "This link has expired. Click below to resend a new verification email."
    And a Resend Email button is visible and functional

  Scenario: Unverified user cannot access product features
    Given a student who has not verified their email
    When they sign in and navigate to /dashboard
    Then they are redirected to the "Check your email" screen
    And no product data is loaded

  Scenario: Resend sends new email and invalidates previous link
    Given a student on the email verification waiting screen
    When they click Resend Email
    Then a new verification email is sent within 2 minutes
    And the previously issued link no longer activates the account
