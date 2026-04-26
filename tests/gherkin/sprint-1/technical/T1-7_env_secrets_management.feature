# Story: TS1-07 — Environment Variables & Secrets Management
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Unit (startup check) + Static analysis
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → tests/unit/config/env-check.test.ts → 'all required server env vars present'
# Scenario 2 → CI secret scan (TruffleHog) — automated on every PR
# Scenario 3 → tests/unit/config/env-check.test.ts → 'NEXT_PUBLIC_ vars contain no secrets'
# Scenario 4 → Static analysis: no NEXT_PUBLIC_OPENAI or similar keys in source

Feature: Environment Variables & Secrets Management
  As the platform
  I need all secrets managed via environment variables
  So that no credentials are ever committed to source code

  Scenario: Application startup fails fast if a required server-side env var is missing
    Given the server starts with OPENAI_API_KEY unset
    When the application initializes
    Then startup throws an error naming "OPENAI_API_KEY" as missing
    And the application does not start in a broken half-configured state

  Scenario: No secrets are committed to the repository
    Given the full git history of the repository
    When TruffleHog secret scanning runs against the diff
    Then zero high-confidence secrets are detected
    And no API keys, tokens, or passwords are found in any tracked file

  Scenario: NEXT_PUBLIC_ variables contain only non-secret values
    Given all environment variables prefixed with NEXT_PUBLIC_
    When each is inspected for secret patterns
    Then none match patterns for API keys, passwords, or tokens
    And the only NEXT_PUBLIC_ vars are SUPABASE_URL, SUPABASE_ANON_KEY, APP_VERSION, ENVIRONMENT

  Scenario: .env.example documents all required env vars with empty values
    Given the .env.example file in the repository root
    When it is compared to the env var validation list in lib/config/env.ts
    Then every required variable appears in .env.example
    And every value in .env.example is empty (no real credentials committed)
