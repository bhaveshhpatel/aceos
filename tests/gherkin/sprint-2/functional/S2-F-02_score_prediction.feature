# Story: S2-F-02 — AP Score Prediction Display
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration
# Story Source: docs/phase-1/epic-1/Sprint_2_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/dashboard/score-prediction.spec.ts → 'predicted score shown on dashboard'
# Scenario 2 → tests/integration/api/prediction.test.ts → 'POST /api/predict returns valid score schema'
# Scenario 3 → tests/e2e/dashboard/score-prediction.spec.ts → 'score updates after diagnostic completion'
# Scenario 4 → tests/e2e/dashboard/score-prediction.spec.ts → 'AI unavailable shows graceful fallback'

Feature: AP Score Prediction Display
  As a student
  I want to see my predicted AP exam score on my dashboard
  So that I understand where I stand and feel motivated to improve

  Background:
    Given a student who has completed a diagnostic for "AP US History"
    And the student's SIP mastery_map has non-empty data
    And the student is logged in and on their dashboard

  Scenario: Predicted AP score is displayed prominently on the dashboard
    Given the student's diagnostic is complete
    When they view the dashboard
    Then a predicted score between 1 and 5 is displayed for "AP US History"
    And the prediction is accompanied by a confidence indicator
    And the prediction shows which topics most influence the score

  Scenario: Score prediction API returns a valid structured response
    Given a valid prediction request payload with student mastery data
    When a POST is sent to "/api/predict"
    Then the response status is 200
    And the response body matches the score prediction Zod schema
    And predicted_score is an integer between 1 and 5
    And confidence is a float between 0.0 and 1.0
    And key_factors is a non-empty array

  Scenario: Score prediction updates after the student completes a new session
    Given the student's current predicted score for "AP US History" is 3
    When they complete a study session that improves their "Civil War" mastery
    And they return to the dashboard
    Then the predicted score is recalculated
    And the updated prediction reflects the improved mastery score

  Scenario: Score prediction gracefully handles AI provider unavailability
    Given the AI gateway is unavailable (all providers down)
    When the dashboard attempts to load the score prediction
    Then the dashboard still loads without error
    And the score prediction widget shows "Prediction unavailable — try again later"
    And no 500 error is returned to the client
