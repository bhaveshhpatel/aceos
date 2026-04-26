# Story: TS2-03 — Versioned Prompt Template System
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: Unit (primary) — fully deterministic
# Story Source: docs/phase-1/epic-1/Sprint_2_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/unit/ai/prompts/render.test.ts → 'renderPrompt substitutes all variables'
# Scenario 2 → tests/unit/ai/prompts/render.test.ts → 'renderPrompt throws on missing required variable'
# Scenario 3 → tests/unit/ai/prompts/render.test.ts → 'no unreplaced {{tokens}} in rendered output'
# Scenario 4 → tests/unit/ai/prompts/registry.test.ts → 'registry resolves correct version for each key'
# Scenario 5 → tests/unit/ai/prompts/integrity.test.ts → 'ESLint rule blocks inline prompt strings'
# Scenario 6 → tests/unit/ai/prompts/render.test.ts → 'token budget exceeded throws before AI call'

Feature: Versioned Prompt Template System
  As the platform
  I need all AI prompts managed as versioned, testable code assets
  So that prompt changes are tracked, rollbackable, and never buried in application routes

  Background:
    Given all prompt templates live in lib/ai/prompts/
    And the registry at lib/ai/prompts/registry.ts maps keys to active versions

  Scenario: renderPrompt correctly substitutes all template variables
    Given the humanities_grader_v1 template requires variables: subject, frq_type, rubric, student_response
    When renderPrompt is called with all four variables provided
    Then the returned user string contains the value of each variable
    And the returned system string contains static instructions only
    And no template token {{variable}} remains in either output string

  Scenario: renderPrompt throws a descriptive error when a required variable is missing
    Given the humanities_grader_v1 template requires variable "rubric"
    When renderPrompt is called without the "rubric" key
    Then an error is thrown
    And the error message contains "rubric" to identify the missing variable
    And the error is thrown before any AI call is attempted

  Scenario: Rendered prompts contain no unreplaced template tokens
    Given any prompt template is rendered with a full valid variable set
    When the rendered output is inspected
    Then neither the system string nor the user string contains any pattern matching \{\{\w+\}\}

  Scenario: Registry resolves the correct active version for each prompt key
    Given registry.ts maps "frq_humanities_grader" to version "v1"
    When the registry is queried for key "frq_humanities_grader"
    Then it returns the template object from humanities_grader_v1.ts
    And the returned template has fields: systemTemplate, userTemplate, requiredVariables, maxInputTokens

  Scenario: ESLint rule blocks inline prompt strings outside lib/ai/prompts/
    Given a TypeScript file outside lib/ai/prompts/ containing a string matching AI system prompt patterns
    When ESLint runs with the no-inline-prompts rule active
    Then ESLint reports an error on that file
    And the PR CI job fails

  Scenario: renderPrompt throws when rendered prompt exceeds the token budget
    Given a template with maxInputTokens = 2000
    When renderPrompt is called with variables that produce 2001 tokens of combined input
    Then an error is thrown naming the prompt key and actual vs allowed token count
    And no AI call is made
