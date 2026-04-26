# Story: S1-F-09 — Parental Consent Email Delivery
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Integration (primary) + E2E (secondary)
# Story Source: docs/phase-1/epic-1/Sprint_1_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/integration/email/consent-email.test.ts → 'email delivered within 2 min'
# Scenario 2 → tests/integration/email/consent-email.test.ts → 'email contains required content'
# Scenario 3 → tests/integration/api/auth.test.ts → 'expired consent link rejected'
# Scenario 4 → tests/integration/api/auth.test.ts → 'approval link is single-use'

Feature: Parental Consent Email Delivery
  As a parent of an under-18 student
  I want to receive a clear consent email with Approve and Decline actions
  So that I can make an informed decision about my child's use of AceOS

  Scenario: Consent email is delivered within 2 minutes
    Given an under-18 student submits the parental consent screen with parent email "parent@example.com"
    When the form is submitted
    Then the consent email arrives in the parent's inbox within 2 minutes

  Scenario: Consent email contains all required content
    Given a consent email sent for student "Jordan"
    Then the subject line contains "Jordan"
    And the email body contains an Approve button
    And the email body contains a Decline link
    And the email body contains a link to the Privacy Policy
    And the email states the link expires in 7 days

  Scenario: Consent approval link expires after 7 days
    Given a parent consent link that is more than 7 days old
    When the parent clicks Approve
    Then they see "This approval link has expired. Please ask your student to request a new one."
    And profiles.parental_consent_status remains 'pending'

  Scenario: Consent approval link is single-use
    Given a parent who has already clicked Approve once
    When the same approval link is clicked again
    Then the page shows "This account has already been approved."
    And no duplicate state changes are written to the database
