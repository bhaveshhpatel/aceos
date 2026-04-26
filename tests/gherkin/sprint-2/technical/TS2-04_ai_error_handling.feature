# Story: TS2-04 — AI Error Handling
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: Unit (primary) + E2E negative paths
# Story Source: docs/phase-1/epic-1/Sprint_2_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/unit/ai/errors.test.ts → 'AIError classifies PROVIDER_UNAVAILABLE correctly'
# Scenario 2 → tests/unit/ai/errors.test.ts → 'AIError classifies INVALID_RESPONSE correctly'
# Scenario 3 → tests/unit/api/handleAIError.test.ts → 'handleAIError maps each code to correct HTTP status'
# Scenario 4 → tests/unit/api/handleAIError.test.ts → 'handleAIError never leaks internal error to client'
# Scenario 5 → tests/e2e/ai-errors/error-states.spec.ts → 'AIErrorState component renders retry button'
# Scenario 6 → tests/unit/ai/schemas.test.ts → 'Zod parse failure throws INVALID_RESPONSE AIError'

Feature: AI Error Handling
  As a student
  I need AI errors to be handled gracefully with clear messaging
  So that I am never left with a blank screen or a cryptic error code

  Background:
    Given the AIError class is defined in lib/ai/errors.ts
    And USER_FACING_ERRORS maps every AIError code to a user-safe message string

  Scenario: PROVIDER_UNAVAILABLE is classified and has a user-facing message
    Given the AI provider returns an HTTP 503
    When the gateway classifies the error
    Then an AIError with code "PROVIDER_UNAVAILABLE" is thrown
    And USER_FACING_ERRORS["PROVIDER_UNAVAILABLE"] returns a non-empty string
    And the string does not mention "503" or internal service names

  Scenario: INVALID_RESPONSE is thrown when AI output fails Zod schema validation
    Given the AI provider returns a response that does not match the grading schema
    When the Zod schema parser runs on the response
    Then an AIError with code "INVALID_RESPONSE" is thrown
    And the error includes the route key that produced the invalid response
    And the raw AI content is not exposed in the error message to clients

  Scenario: handleAIError maps each AIError code to the correct HTTP status
    Given handleAIError is the error handler for all API routes with AI calls
    When it receives an AIError with code "RATE_LIMITED"
    Then it returns HTTP 429
    When it receives an AIError with code "PROVIDER_UNAVAILABLE"
    Then it returns HTTP 503
    When it receives an AIError with code "INVALID_RESPONSE"
    Then it returns HTTP 502
    When it receives an AIError with code "INPUT_TOO_LONG"
    Then it returns HTTP 400

  Scenario: handleAIError response body never exposes internal error details
    Given any AIError is passed to handleAIError
    When it constructs the HTTP response
    Then the response body contains only: error_code, user_message, and request_id
    And the response body does not contain stack_trace, raw_response, or internal field names

  Scenario: AIErrorState component renders a retry button and user-safe message
    Given a page where an AI call has failed with PROVIDER_UNAVAILABLE
    When the AIErrorState component renders
    Then the user sees the human-readable message from USER_FACING_ERRORS
    And a "Try again" button is visible and clickable
    And the component has role="alert" for accessibility
    And no error code or technical detail is visible to the student

  Scenario: Unknown thrown errors are wrapped as UNKNOWN_ERROR before reaching the client
    Given an API route where an unexpected non-AIError exception is thrown
    When handleAIError processes the exception
    Then the response status is 500
    And the response contains error_code "UNKNOWN_ERROR"
    And the original exception message is logged server-side but not returned to the client
