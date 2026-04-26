# Story: TS2-05 — 50-Question QA Pipeline
# Sprint: 2 | Epic: 1 | Phase: 1
# Test Layer: Manual / Scheduled QA — NOT a CI gate (too slow, real AI calls)
# Story Source: docs/phase-1/epic-1/Sprint_2_Technical_Stories.md
# Last Updated: 2026-04-26
#
# Automation Map:
# Scenario 1 → scripts/qa/run-harness.ts → 'harness runs 50 fixtures and prints pass/fail report'
# Scenario 2 → tests/unit/qa/harness.test.ts → 'harness correctly counts pass/fail from fixture results'
# Scenario 3 → tests/unit/qa/harness.test.ts → 'harness marks fixture failed when schema validation fails'
# Scenario 4 → scripts/qa/run-harness.ts → 'harness exits non-zero when pass rate < 90%'
# Scenario 5 → Manual checklist: QA sign-off required before each subject goes live
#
# NOTE: @live-ai scenarios require real AI calls. Run manually or on schedule, NEVER in PR CI.

Feature: 50-Question QA Pipeline
  As the engineering team
  I need a repeatable quality gate for AI grading accuracy
  So that I know the grading pipeline meets the required accuracy bar before going live

  Background:
    Given the QA harness script at scripts/qa/run-harness.ts
    And fixture files at scripts/qa/fixtures/ with known inputs and expected output schemas
    And each fixture has fields: input, expected_schema, subject, frq_type, notes

  Scenario: QA harness runs all 50 fixtures and produces a pass/fail report
    Given 50 fixture files are present in scripts/qa/fixtures/
    When the harness script runs
    Then it processes all 50 fixtures
    And it produces a report showing passed count, failed count, and failure details
    And the report identifies which fixture failed and why (schema mismatch, timeout, error)

  Scenario: Harness correctly counts pass and fail from fixture results
    Given a fixture set where 45 pass and 5 fail schema validation
    When the harness aggregates results
    Then pass_count = 45 and fail_count = 5
    And the pass rate is reported as 90.0%

  Scenario: Harness marks a fixture as failed when AI response fails Zod schema validation
    Given a fixture where the AI response is missing required field "total_score"
    When the harness runs that fixture
    Then the fixture result is marked FAIL
    And the failure reason states "schema_validation_failed" with the missing field name
    And the harness continues processing remaining fixtures (does not abort)

  Scenario: Harness exits with non-zero code when pass rate falls below 90%
    Given the harness runs and 44 of 50 fixtures pass (88%)
    When execution completes
    Then the process exits with a non-zero exit code
    And the output clearly states "FAILED: pass rate 88.0% is below required 90.0%"

  @live-ai
  Scenario: Live QA harness achieves >= 90% pass rate for AP US History DBQ grading
    Given 50 AP US History DBQ fixture pairs (student response + expected rubric schema)
    When the live QA harness runs against the production AI gateway
    Then at least 45 of 50 responses pass Zod schema validation
    And at least 45 of 50 responses contain rubric scores within expected ranges
    And the harness report is saved to scripts/qa/reports/ with a timestamp

  @manual
  Scenario: SME sign-off confirms AI grading aligns with College Board standards
    Given the QA harness has passed the 90% automated gate for a subject
    When an AP-certified SME reviews 10 randomly sampled graded responses
    Then they confirm at least 8 of 10 align with College Board rubric standards
    And any disagreements are logged in the sme_corrections table
    And the subject is cleared for student-facing release only after this step
