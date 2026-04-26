# Story: S2-F-01 — Diagnostic Assessment Flow
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration (API contract)
# Story Source: docs/phase-1/epic-1/Sprint_2_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/diagnostic/diagnostic-flow.spec.ts → 'student completes diagnostic and sees heatmap'
# Scenario 2 → tests/integration/api/diagnostic.test.ts → 'POST /api/diagnostic/submit saves answers'
# Scenario 3 → tests/e2e/diagnostic/diagnostic-flow.spec.ts → 'progress persists on page refresh'
# Scenario 4 → tests/integration/api/diagnostic.test.ts → 'diagnostic blocked for unverified minor'
# Scenario 5 → tests/e2e/diagnostic/diagnostic-flow.spec.ts → 'STEM answer shows validation feedback'

Feature: Diagnostic Assessment Flow
  As a student
  I want to complete a diagnostic assessment for my AP subjects
  So that the platform can identify my knowledge gaps and build my SIP

  Background:
    Given a verified student with parental_consent_verified = true
    And the student has selected "AP US History" and "AP Chemistry"
    And the student is logged in

  Scenario: Student completes a full diagnostic and sees their mastery heatmap
    Given the student navigates to "/diagnostic/AP US History"
    When they answer all diagnostic questions
    And submit the diagnostic
    Then they are redirected to the results page
    And a mastery heatmap is displayed showing topic-level mastery scores
    And their SIP mastery_map is updated in the database with non-empty values

  Scenario: Diagnostic answers are saved per question, not only on final submission
    Given the student is on diagnostic question 3 of 20
    When they select an answer and click "Next"
    Then the answer for question 3 is persisted to the database immediately
    And if the student refreshes the page they resume at question 4

  Scenario: Student with unverified parental consent cannot start a diagnostic
    Given a student with parental_consent_verified = false
    When they navigate to "/diagnostic/AP Chemistry"
    Then they are redirected to the parental consent pending page
    And no diagnostic questions are shown
    And no data is written to the diagnostic_answers table

  Scenario: AP Chemistry STEM answer shows validation feedback from Modal sandbox
    Given the student is on a chemistry MCQ requiring a numerical answer
    When they enter "44.01" as their answer and submit
    Then a POST request is sent to the STEM validation endpoint
    And the response indicates whether the answer is correct within tolerance
    And the UI displays a green checkmark (correct) or red indicator (incorrect)
    And if Modal is unavailable the UI shows a neutral "answer recorded" state

  Scenario: Diagnostic adapts question difficulty based on running performance
    Given the student has answered the first 5 questions all correctly
    When question 6 is fetched
    Then the fetched question has a difficulty level higher than the initial questions
    And the API response includes the reason for the difficulty adjustment
