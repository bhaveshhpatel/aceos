# Story: TS1-03 — Vercel + GitHub Actions CI Pipeline
# Sprint: 1 | Epic: 1 | Phase: 1
# Test Layer: Integration (pipeline validation) — no unit tests applicable
# Story Source: docs/phase-1/epic-1/Sprint_1_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → Verified by CI run on PR — pipeline passes on green code
# Scenario 2 → Verified by CI run on PR — pipeline fails on lint error introduced
# Scenario 3 → Verified by CI run on PR — npm audit gate fires on known vulnerability
# Scenario 4 → tests/unit/config/env-check.test.ts → 'all required env vars defined'
# Scenario 5 → Verified by Vercel preview URL existence on PR

Feature: CI/CD Pipeline
  As the engineering team
  I need a CI pipeline that enforces quality gates
  So that no broken or insecure code can merge to main

  Scenario: CI pipeline runs all required jobs on a pull request to main
    Given a pull request is opened targeting the main branch
    When the GitHub Actions workflow triggers
    Then the "Code Quality" job runs ESLint and TypeScript type-check
    And the "Security Audit" job runs npm audit
    And the "Unit Tests" job runs Vitest with coverage reporting
    And the "Build" job runs next build
    And all jobs must pass before the PR is mergeable

  Scenario: CI fails when ESLint errors are present
    Given a branch with a committed ESLint error (unused import)
    When the CI pipeline runs
    Then the "Code Quality" job exits with a non-zero status
    And the PR is marked as failing
    And a clear error message names the file and rule that failed

  Scenario: CI fails when a high-severity npm vulnerability is present
    Given a branch with a dependency containing a known high-severity CVE
    When the "Security Audit" job runs npm audit --audit-level high
    Then the job exits with a non-zero status
    And the PR cannot be merged

  Scenario: Build fails fast if required environment variables are missing
    Given the CI environment is missing the OPENAI_API_KEY variable
    When the build job runs
    Then the application startup check detects the missing variable
    And the build exits with a clear error naming "OPENAI_API_KEY"

  Scenario: Every PR to main receives a Vercel preview deployment
    Given a pull request is opened targeting main with a passing CI
    When Vercel processes the branch
    Then a unique preview URL is generated and posted as a PR comment
    And the preview URL returns HTTP 200
