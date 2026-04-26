# Story: S2-F-04 — AI Study Plan Generation
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: E2E (primary) + Integration
# Story Source: docs/phase-1/epic-1/Sprint_2_Functional_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/e2e/study/study-plan.spec.ts → 'study plan generated after diagnostic'
# Scenario 2 → tests/integration/api/study-plan.test.ts → 'POST /api/study-plan returns valid plan schema'
# Scenario 3 → tests/e2e/study/study-plan.spec.ts → 'plan updates after new session data'
# Scenario 4 → tests/e2e/study/study-plan.spec.ts → 'plan unavailable shows fallback'

Feature: AI Study Plan Generation
  As a student
  I want a personalized study plan generated from my diagnostic results
  So that I know exactly what to study and in what order

  Background:
    Given a student who has completed diagnostics for at least one subject
    And their SIP mastery_map contains topic-level scores

  Scenario: Study plan is generated automatically after diagnostic completion
    Given the student completes their diagnostic for "AP Chemistry"
    When they are redirected to the dashboard
    Then a study plan section is visible
    And the plan lists at least 3 priority topics ordered by impact on predicted score
    And each topic has an estimated study time in minutes

  Scenario: Study plan API returns a schema-valid response
    Given a valid study plan request with mastery_map data
    When a POST is sent to "/api/study-plan"
    Then the response status is 200
    And the response body matches the study plan Zod schema
    And priority_topics is a non-empty array
    And each item has fields: topic, estimated_minutes, priority_rank

  Scenario: Study plan regenerates when mastery scores improve
    Given the student's current plan ranks "Electrochemistry" as priority 1
    When they complete a study session that significantly improves "Electrochemistry" mastery
    And they trigger plan regeneration
    Then "Electrochemistry" moves down in priority rank
    And a different topic takes priority 1

  Scenario: Study plan section shows a graceful fallback when AI is unavailable
    Given the AI gateway returns an error for study plan generation
    When the dashboard loads
    Then the study plan section renders with a "Generating your plan..." state
    And no error code or stack trace is visible to the student
    And the rest of the dashboard loads normally
