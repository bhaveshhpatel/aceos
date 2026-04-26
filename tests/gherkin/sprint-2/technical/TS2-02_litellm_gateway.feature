# Story: TS2-02 — LiteLLM Gateway
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: Unit (primary) — AI calls always mocked in tests
# Story Source: docs/phase-1/epic-1/Sprint_2_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/unit/ai/gateway.test.ts → 'callAI routes frq_grading to correct model'
# Scenario 2 → tests/unit/ai/gateway.test.ts → 'callAI retries on 429 with exponential backoff'
# Scenario 3 → tests/unit/ai/gateway.test.ts → 'callAI throws PROVIDER_UNAVAILABLE when all retries exhausted'
# Scenario 4 → tests/unit/ai/gateway.test.ts → 'callAI logs usage to ai_usage_log table'
# Scenario 5 → tests/unit/ai/gateway.test.ts → 'unknown route key throws configuration error'
# Scenario 6 → tests/unit/ai/gateway.test.ts → 'model_map change routes to new model without code change'

Feature: LiteLLM AI Gateway
  As the platform
  I need all AI calls routed through a single gateway driven by model_map.json
  So that any AI provider can be swapped by config change with zero code changes

  Background:
    Given the AI gateway is initialized from model_map.json
    And model_map.json contains routes for frq_grading, mcq_evaluation, score_prediction, study_plan_generation, wrong_answer_explainer

  Scenario: callAI routes a frq_grading request to the model specified in model_map.json
    Given model_map.json specifies provider "openai" and model "gpt-4o" for route "frq_grading"
    When callAI is called with route "frq_grading"
    Then the outbound API call goes to the OpenAI endpoint
    And the model parameter in the request body is "gpt-4o"
    And no hardcoded model name exists in the gateway TypeScript code

  Scenario: callAI retries on HTTP 429 (rate limit) with exponential backoff
    Given the AI provider returns HTTP 429 on the first two calls
    And the third call succeeds
    When callAI is invoked
    Then two retries are attempted before the successful call
    And the delay between attempts follows exponential backoff
    And the final response is returned successfully to the caller

  Scenario: callAI throws PROVIDER_UNAVAILABLE after max retries are exhausted
    Given the AI provider returns HTTP 500 on all retry attempts
    When callAI is invoked and all retries are exhausted
    Then an AIError with code "PROVIDER_UNAVAILABLE" is thrown
    And the error is not a raw fetch error or untyped exception

  Scenario: Every successful AI call is logged to ai_usage_log
    Given a successful callAI invocation
    When the response is returned to the caller
    Then a row is inserted into ai_usage_log with route, model, prompt_tokens, completion_tokens, latency_ms
    And the insert is non-blocking (does not delay the response)

  Scenario: callAI throws a configuration error for an unknown route key
    Given model_map.json does not contain a route named "nonexistent_route"
    When callAI is called with route "nonexistent_route"
    Then an error is thrown immediately with message containing "Unknown route: nonexistent_route"
    And no HTTP request is made to any AI provider

  Scenario: Changing model in model_map.json re-routes all calls without code changes
    Given model_map.json is updated to use provider "groq" for route "mcq_evaluation"
    When callAI is called with route "mcq_evaluation"
    Then the outbound request goes to the Groq endpoint
    And no TypeScript file other than model_map.json was modified
