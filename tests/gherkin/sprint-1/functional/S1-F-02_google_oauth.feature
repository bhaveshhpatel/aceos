# Story: S1-F-02 — Google OAuth Sign-Up & Sign-In
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/google-oauth.spec.ts → 'new Google user is onboarded'
# Scenario 2 → tests/e2e/auth/google-oauth.spec.ts → 'returning Google user reaches dashboard'
# Scenario 3 → tests/e2e/auth/google-oauth.spec.ts → 'OAuth failure shows friendly error'
# Scenario 4 → tests/integration/api/auth.test.ts → 'Google OAuth does not create duplicate account'

Feature: Google OAuth Sign-Up & Sign-In
  As a student
  I want to sign up or sign in using my Google account
  So that I do not need to remember a separate password

  Scenario: New Google user is redirected to onboarding after OAuth
    Given a Google account "newgoogle@gmail.com" has never signed into AceOS
    When the user completes the Google OAuth flow
    Then a profiles row is created with name and email from the Google profile
    And the user is redirected to the age gate or onboarding flow
    And the user is NOT sent to the dashboard directly

  Scenario: Returning Google user is sent directly to dashboard
    Given a Google account "returning@gmail.com" has an existing AceOS account with completed onboarding
    When the user completes the Google OAuth flow
    Then the user is redirected to /dashboard
    And no new profiles record is created

  Scenario: Google OAuth cancellation shows friendly error
    Given a user initiates Google OAuth from the signup page
    When the user cancels the Google OAuth popup
    Then the user sees "Sign-in with Google failed. Please try again or use email instead."
    And no account is created or modified
    And the user remains on the signup page

  Scenario: Existing email-signup account is not duplicated on Google OAuth
    Given a student previously signed up with email "shared@test.com" using email/password
    When they sign in via Google OAuth using the same email "shared@test.com"
    Then the system links to the existing account
    And no duplicate profiles row is created
    And the user is signed in to the existing account
