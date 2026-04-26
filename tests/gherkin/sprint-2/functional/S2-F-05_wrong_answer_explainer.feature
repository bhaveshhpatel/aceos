# Story: S2-F-05 — Wrong Answer Explainer
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration
# Story Source: docs/phase-1/epic-1/Sprint_2_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/study/explainer.spec.ts → 'wrong answer triggers explainer request'
# Scenario 2 → tests/integration/api/explainer.test.ts → 'POST /api/explain returns schema-valid response'
# Scenario 3 → tests/e2e/study/explainer.spec.ts → 'explainer unavailable does not block next question'
# Scenario 4 → tests/unit/ai/schemas/explainer.test.ts → 'explainer schema rejects empty explanation'

Feature: Wrong Answer Explainer
  As a student
  I want to understand why my answer was wrong
  So that I learn from mistakes rather than just being told I was wrong

  Background:
    Given a student answering MCQ questions in their daily study queue

  Scenario: Wrong MCQ answer automatically triggers an explainer
    Given the student answers a question incorrectly
    When the answer is submitted
    Then an explanation appears within 2 seconds
    And the explanation references the specific wrong answer the student chose
    And the explanation references why the correct answer is correct
    And the explanation is no longer than 200 words

  Scenario: Explainer API returns a schema-valid response
    Given a valid explainer request with question_id, student_answer, and correct_answer
    When a POST is sent to "/api/explain"
    Then the response status is 200
    And the response body matches the explainer Zod schema
    And explanation is a non-empty string of at least 20 characters
    And topic_reinforcement lists at least one related concept

  Scenario: Explainer unavailability does not block the student from continuing
    Given the AI gateway times out on the explainer request
    When the student submits a wrong answer
    Then the correct answer is shown immediately
    And a fallback message "Explanation temporarily unavailable" is shown
    And the "Next question" button is active and clickable
    And the student is not stuck waiting

  Scenario: Explainer response is cached and not re-fetched for the same question
    Given the student has already received an explainer for question "q-123"
    When they navigate back to that question in their session review
    Then the cached explanation is shown
    And no new API call is made to the explainer endpoint
