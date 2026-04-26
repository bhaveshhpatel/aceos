# Story: TS1-05 — Legal Pages (ToS, Privacy Policy, COPPA Notice)
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) — content verification
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/legal/legal-pages.spec.ts → 'ToS page loads and contains required sections'
# Scenario 2 → tests/e2e/legal/legal-pages.spec.ts → 'Privacy Policy page references FERPA'
# Scenario 3 → tests/e2e/legal/legal-pages.spec.ts → 'ToS checkbox gates form submission'
# Scenario 4 → tests/e2e/legal/legal-pages.spec.ts → 'COPPA notice displayed for under-13 age'

Feature: Legal Pages
  As a student or parent
  I need to review and accept legal documents
  So that AceOS is compliant with FERPA, COPPA, and standard ToS requirements

  Scenario: Terms of Service page exists and contains required sections
    Given an unauthenticated user
    When they navigate to "/legal/terms"
    Then the page returns HTTP 200
    And the page contains a section titled "Data Collection"
    And the page contains a section titled "Parental Consent"
    And the page contains a section titled "FERPA Rights"
    And the page has a "Last Updated" date visible

  Scenario: Privacy Policy page references FERPA and data handling practices
    Given an unauthenticated user
    When they navigate to "/legal/privacy"
    Then the page returns HTTP 200
    And the page contains the text "FERPA"
    And the page specifies which third-party services receive student data
    And the page contains contact information for data deletion requests

  Scenario: Signup form cannot be submitted without ToS checkbox checked
    Given a student on the signup page
    And the ToS acceptance checkbox is unchecked
    When they attempt to submit the signup form
    Then the form does not submit
    And an inline validation message prompts them to accept the Terms of Service

  Scenario: COPPA notice is shown when a user enters an age under 13
    Given a student on the signup age entry step
    When they enter a date of birth that makes them 12 years old
    Then a COPPA-specific notice is displayed
    And the notice states that a parent must complete signup on their behalf
