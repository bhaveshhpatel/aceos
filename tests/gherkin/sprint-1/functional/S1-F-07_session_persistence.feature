# Story: S1-F-07 — Session Persistence & Sign-Out
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/auth/session.spec.ts → 'session persists after refresh'
# Scenario 2 → tests/e2e/auth/session.spec.ts → 'session persists across tabs'
# Scenario 3 → tests/e2e/auth/session.spec.ts → 'sign-out clears session and redirects'
# Scenario 4 → tests/e2e/auth/session.spec.ts → 'expired session redirects with message'

Feature: Session Persistence & Sign-Out
  As a student
  I want my session to persist across browser refreshes and tabs
  So that I do not need to sign in every time I open the app

  Scenario: Session persists after browser refresh
    Given a student who is signed in and on the dashboard
    When they refresh the browser
    Then they remain signed in
    And the dashboard loads correctly without a redirect to sign-in

  Scenario: Session persists when opening AceOS in a new tab
    Given a student who is signed in on one tab
    When they open AceOS in a new browser tab
    Then they are automatically signed in in the new tab
    And no sign-in credentials are required

  Scenario: Sign-out clears session and redirects to sign-in
    Given a signed-in student
    When they click Sign Out
    Then the session token is revoked
    And they are redirected to /signin
    And navigating to /dashboard redirects back to /signin

  Scenario: Expired session redirects gracefully with return URL
    Given a student whose session token has expired
    When they attempt to access /dashboard
    Then they are redirected to /signin
    And the message "Your session has expired. Please sign in again." is shown
    And after signing in they are returned to /dashboard
