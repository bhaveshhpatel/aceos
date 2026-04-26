# Story: TS1-04 — Global Error Boundaries & Error Handling
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Unit (primary) + E2E negative paths
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/unit/api/error-handler.test.ts → 'unhandled error returns sanitized 500'
# Scenario 2 → tests/unit/api/error-handler.test.ts → 'validation error returns 400 with field details'
# Scenario 3 → tests/e2e/error-states/global-error.spec.ts → 'crash renders error boundary not blank screen'
# Scenario 4 → tests/unit/api/error-handler.test.ts → 'internal error never leaks stack trace to client'

Feature: Global Error Boundaries
  As a student
  I need the application to handle errors gracefully
  So that I never see a blank screen or raw server error

  Background:
    Given the global error handler is registered on all API routes

  Scenario: Unhandled server error returns a structured 500 with no stack trace
    Given an API route that throws an unexpected internal error
    When a request is made to that route
    Then the response status is 500
    And the response body contains field "error" with a user-safe message
    And the response body does NOT contain a stack trace
    And the response body does NOT contain any file path or internal variable name

  Scenario: Zod validation failure returns 400 with specific field errors
    Given a POST request to "/api/auth/signup" with a missing "email" field
    When the request is processed
    Then the response status is 400
    And the response body contains error code "VALIDATION_ERROR"
    And the response body contains field-level detail naming "email" as invalid

  Scenario: React error boundary catches a component crash and renders fallback UI
    Given a page component that throws a runtime error during render
    When the user navigates to that page
    Then the application does not show a blank white screen
    And a fallback error UI is displayed with a "Try again" option
    And the rest of the application layout remains intact

  Scenario: Error handler strips sensitive data before logging
    Given an error that contains a database connection string in its message
    When the error handler processes and logs the error
    Then the log entry does not contain the connection string
    And the log entry contains the error code and route name only
