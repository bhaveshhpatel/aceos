# Story: S2-F-03 — FRQ Submission & AI Grading
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration
# Story Source: docs/phase-1/epic-1/Sprint_2_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/frq/frq-submission.spec.ts → 'student submits FRQ and sees streamed score'
# Scenario 2 → tests/integration/api/frq.test.ts → 'POST /api/frq/submit validates input and returns rubric score'
# Scenario 3 → tests/e2e/frq/frq-submission.spec.ts → 'grading result persists after page reload'
# Scenario 4 → tests/e2e/frq/frq-submission.spec.ts → 'student can dispute a grade'
# Scenario 5 → tests/integration/api/frq.test.ts → 'FRQ grading rejects text over max length'

Feature: FRQ Submission & AI Grading
  As a student
  I want to submit a practice FRQ essay and receive rubric-based feedback
  So that I understand exactly where I lost points and how to improve

  Background:
    Given a student with consent verified and "AP US History" selected
    And they are on the FRQ practice page for a DBQ prompt

  Scenario: Student submits an FRQ and receives streamed rubric feedback
    Given the student has written a response of at least 100 words
    When they click "Submit for Grading"
    Then a loading state appears immediately
    And rubric feedback begins streaming to the page within 3 seconds
    And the final score out of maximum points is displayed when streaming completes
    And each rubric category shows points earned vs points available

  Scenario: FRQ submission API validates input before calling AI
    Given a POST request to "/api/frq/submit" with response_text of 5 characters
    When the request is processed
    Then the response status is 400
    And the response contains error code "VALIDATION_ERROR"
    And no AI call is made

  Scenario: FRQ grading result persists and is retrievable after page reload
    Given the student has received a grading result for submission id "sub-123"
    When they reload the FRQ page
    Then the previously graded result for "sub-123" is displayed
    And the score and feedback match the original grading
    And no new AI call is triggered

  Scenario: Student can flag a grading result for human review
    Given the student disagrees with a score on submission "sub-123"
    When they click "Dispute this grade"
    Then the frq_submissions row for "sub-123" has review_status = "flagged"
    And a confirmation message tells the student their dispute was recorded
    And the current AI score is preserved alongside the flagged status

  Scenario: FRQ response over 10,000 characters is rejected before AI call
    Given the student submits a response of 10,001 characters
    When the request hits the API
    Then the response status is 400
    And the error names the max_length constraint
    And no AI provider is called
