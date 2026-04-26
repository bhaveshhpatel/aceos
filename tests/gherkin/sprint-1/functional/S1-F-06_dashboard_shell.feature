# Story: S1-F-06 — Student Dashboard Shell
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/dashboard/dashboard.spec.ts → 'dashboard loads correct subjects'
# Scenario 2 → tests/e2e/dashboard/dashboard.spec.ts → 'unauthenticated redirected to signin'
# Scenario 3 → tests/e2e/dashboard/dashboard.spec.ts → 'nav bar visible on all pages'
# Scenario 4 → tests/e2e/dashboard/dashboard.spec.ts → 'welcome message uses first name'
# Scenario 5 → tests/e2e/dashboard/dashboard.spec.ts → 'zero subject edge case handled'

Feature: Student Dashboard Shell
  As a student who has completed onboarding
  I want to see a dashboard that reflects my selected subjects
  So that I have a home base for all my study activities

  Scenario: Dashboard loads with exactly the subjects the student selected
    Given a student who selected AP Chemistry and AP US History during onboarding
    When they reach /dashboard
    Then exactly 2 subject cards are displayed
    And each card shows the subject name
    And each card shows "Diagnostic not yet taken"

  Scenario: Unauthenticated user is redirected to sign-in
    Given an unauthenticated user
    When they navigate to /dashboard
    Then they are redirected to /signin
    And no dashboard content is loaded

  Scenario: Navigation bar is visible on all authenticated pages
    Given an authenticated student
    When they are on any product page
    Then the navigation bar is visible
    And it contains links for Dashboard, Practice, FRQ, and Profile

  Scenario: Welcome message uses the student's first name
    Given a student whose first name is "Maria"
    When the dashboard loads
    Then the page contains a welcome message with "Maria"

  Scenario: Zero enrolled subjects shows empty state message
    Given a student who somehow has 0 enrolled subjects
    When the dashboard loads
    Then the message "Add an AP subject to get started" is displayed
    And a link to add subjects is visible
