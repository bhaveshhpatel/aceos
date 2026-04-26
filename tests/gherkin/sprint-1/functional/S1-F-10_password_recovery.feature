# Story: S1-F-10 — Account Recovery (Forgot Password)
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/password-reset.spec.ts → 'reset email is sent'
# Scenario 2 → tests/e2e/auth/password-reset.spec.ts → 'unregistered email shows same message'
# Scenario 3 → tests/e2e/auth/password-reset.spec.ts → 'expired reset link rejected'
# Scenario 4 → tests/e2e/auth/password-reset.spec.ts → 'weak new password rejected'
# Scenario 5 → tests/e2e/auth/password-reset.spec.ts → 'successful reset redirects to signin'

Feature: Account Recovery (Forgot Password)
  As a student who has forgotten their password
  I want to reset it using my email address
  So that I can regain access to my account

  Scenario: Reset email is sent for registered address
    Given a user enters a registered email on the forgot password form
    When they click Send Reset Link
    Then a password reset email is delivered within 2 minutes

  Scenario: Unregistered email shows identical success message (no account enumeration)
    Given a user enters an email that does not exist in the system
    When they submit the forgot password form
    Then the same message is shown: "If an account exists, we've sent a reset link"
    And no error reveals whether the email is registered

  Scenario: Reset link expired after 1 hour is rejected
    Given a password reset link that is more than 1 hour old
    When the user clicks it
    Then they see "This reset link has expired. Please request a new one."

  Scenario: New password that fails requirements is rejected
    Given a user on the password reset form
    When they submit a new password shorter than 8 characters
    Then the specific password rule that failed is shown inline
    And the password is not updated

  Scenario: Successful password reset redirects to sign-in with confirmation
    Given a user who submits a valid new password
    When the reset is processed
    Then they are redirected to /signin
    And the success banner "Password updated. Please sign in." is shown
