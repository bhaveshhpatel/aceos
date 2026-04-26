# Story: TS2-01 — Modal.com Python Sandbox
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: Unit (primary) + Integration (Modal call gated)
# Story Source: docs/phase-1/epic-1/Sprint_2_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/unit/ai/modal-sandbox.test.ts → 'calculus validator returns correct for known answer'
# Scenario 2 → tests/unit/ai/modal-sandbox.test.ts → 'chemistry validator applies correct tolerance'
# Scenario 3 → tests/unit/api/stem-validation.test.ts → 'Modal timeout returns null correct not 500'
# Scenario 4 → tests/unit/api/stem-validation.test.ts → 'API route returns 200 even when Modal unreachable'
# Scenario 5 → tests/integration/modal/stem-sandbox.test.ts → 'live Modal call validates sympy expression' [GATED]
# Scenario 6 → tests/unit/api/stem-validation.test.ts → 'non-STEM subject returns validation_not_required'

Feature: Modal.com Python Sandbox STEM Validation
  As the platform
  I need executable validation of mathematical and scientific answers
  So that STEM correctness is never determined by asking an LLM to judge its own output

  Background:
    Given the Modal sandbox API URL is configured in MODAL_SANDBOX_URL
    And the Next.js STEM validation route is at "/api/validate-stem"

  Scenario: AP Calculus answer within tolerance is evaluated as correct
    Given a STEM validation request for subject "AP Calculus AB"
    And student_answer is "3.14159" and expected_answer is "pi"
    When the Modal sandbox evaluates the expression
    Then the response contains correct = true
    And tolerance_used matches the calculus tolerance of 0.001
    And execution_time_ms is under 2000

  Scenario: AP Chemistry answer outside tolerance is evaluated as incorrect
    Given a STEM validation request for subject "AP Chemistry"
    And student_answer is "45.5" and expected_answer is "44.01"
    When the Modal sandbox evaluates the expression
    Then the response contains correct = false
    And student_value and expected_value are both present in the response
    And the response schema is valid per STEMValidationResponse Zod schema

  Scenario: Modal sandbox timeout returns correct = null, not an error
    Given the Modal sandbox does not respond within 4000ms
    When the STEM validation API processes the request
    Then the HTTP response status is 200
    And correct = null in the response body
    And error = "VALIDATION_UNAVAILABLE" in the response body
    And the student is not shown an error state

  Scenario: STEM validation API returns 200 even when Modal is completely unreachable
    Given MODAL_SANDBOX_URL points to an unreachable host
    When a POST is sent to "/api/validate-stem"
    Then the response status is 200
    And the response body contains correct = null
    And the response body does not expose the internal connection error

  Scenario: Non-STEM subject returns a validation_not_required response
    Given a validation request with subject "AP US History"
    When the request is processed
    Then the response status is 200
    And the response body contains validation_required = false
    And no Modal call is made

  @gated-live
  Scenario: Live Modal sandbox correctly evaluates a sympy calculus expression
    Given the live Modal sandbox is deployed and reachable
    And a request for subject "AP Calculus AB" with student_answer "6x" and expected "6*x"
    When the sandbox evaluates using sympy simplify
    Then the response contains correct = true
    And execution_time_ms is recorded
