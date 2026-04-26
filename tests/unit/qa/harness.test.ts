/**
 * RED UNIT TESTS — TS2-05: QA Pipeline Harness Logic
 *
 * These tests MUST FAIL until implementation exists at:
 *   - scripts/qa/pipeline_audit.ts (runPipelineAudit)
 *   - scripts/qa/fixtures/ (fixture files)
 *
 * NOTE: These tests are for the HARNESS LOGIC only — pure unit tests.
 * The @live-ai QA scenarios (50 real questions) are NOT tested here.
 * Those run manually via scripts/qa/pipeline_audit.ts.
 *
 * Gherkin source: tests/gherkin/sprint-2/technical/TS2-05_qa_pipeline.feature
 */

import { describe, it, expect, vi } from 'vitest';

// These imports WILL FAIL until implementation exists — RED state is correct
import {
  aggregateQAResults,
  computePassRate,
  formatQAReport,
} from '@/scripts/qa/harness';
import type { QAResult } from '@/scripts/qa/types';

// ─────────────────────────────────────────────────────────────
// Test fixtures — representative QAResult shapes
// ─────────────────────────────────────────────────────────────
const makeResult = (overrides: Partial<QAResult> = {}): QAResult => ({
  question_id: `qa_${Math.random().toString(36).slice(2, 7)}`,
  subject: 'AP US History',
  question_type: 'frq',
  pipeline_route: 'frq_grading',
  model_used: 'gpt-4o',
  latency_ms: 1200,
  response_valid: true,
  stem_sandbox_used: false,
  raw_response: '{"total_score":4,"max_score":7,"rubric_points":[],"overall_feedback":"Good effort."}',
  ...overrides,
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — Harness correctly counts pass and fail from fixture results
// ─────────────────────────────────────────────────────────────
describe('aggregateQAResults', () => {
  it('correctly counts pass and fail when 45 pass and 5 fail', () => {
    const results = [
      ...Array.from({ length: 45 }, () => makeResult({ response_valid: true })),
      ...Array.from({ length: 5 }, () => makeResult({ response_valid: false, validation_error: 'schema_validation_failed' })),
    ];

    const summary = aggregateQAResults(results);

    expect(summary.pass_count).toBe(45);
    expect(summary.fail_count).toBe(5);
    expect(summary.total).toBe(50);
  });

  it('returns pass_rate of 1.0 when all results pass', () => {
    const results = Array.from({ length: 50 }, () => makeResult({ response_valid: true }));
    const summary = aggregateQAResults(results);
    expect(summary.pass_rate).toBe(1.0);
  });

  it('returns pass_rate of 0 when all results fail', () => {
    const results = Array.from({ length: 10 }, () => makeResult({ response_valid: false }));
    const summary = aggregateQAResults(results);
    expect(summary.pass_rate).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — Harness marks fixture failed when schema validation fails
// ─────────────────────────────────────────────────────────────
describe('aggregateQAResults failure details', () => {
  it('includes failure reason for each failed result', () => {
    const results = [
      makeResult({ response_valid: true }),
      makeResult({ response_valid: false, validation_error: 'schema_validation_failed: missing total_score' }),
      makeResult({ response_valid: false, validation_error: 'schema_validation_failed: missing rubric_points' }),
    ];

    const summary = aggregateQAResults(results);

    expect(summary.failures).toHaveLength(2);
    expect(summary.failures[0].validation_error).toContain('total_score');
    expect(summary.failures[1].validation_error).toContain('rubric_points');
  });

  it('does not include passing results in the failures array', () => {
    const results = Array.from({ length: 5 }, () => makeResult({ response_valid: true }));
    const summary = aggregateQAResults(results);
    expect(summary.failures).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// computePassRate
// ─────────────────────────────────────────────────────────────
describe('computePassRate', () => {
  it('returns 0.9 for 45 passes out of 50', () => {
    expect(computePassRate(45, 50)).toBe(0.9);
  });

  it('returns 0.88 for 44 passes out of 50', () => {
    expect(computePassRate(44, 50)).toBeCloseTo(0.88, 2);
  });

  it('returns 1.0 for perfect score', () => {
    expect(computePassRate(50, 50)).toBe(1.0);
  });

  it('returns 0 for zero passes', () => {
    expect(computePassRate(0, 50)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — Harness exits non-zero when pass rate < 90%
// ─────────────────────────────────────────────────────────────
describe('formatQAReport', () => {
  it('includes FAILED status in report when pass rate is below 90%', () => {
    const results = [
      ...Array.from({ length: 44 }, () => makeResult({ response_valid: true })),
      ...Array.from({ length: 6 }, () => makeResult({ response_valid: false })),
    ];
    const summary = aggregateQAResults(results);
    const report = formatQAReport(summary);

    expect(report).toContain('FAILED');
    expect(report).toContain('88');
    expect(report).toContain('90');
  });

  it('includes PASSED status in report when pass rate is 90% or above', () => {
    const results = Array.from({ length: 50 }, () => makeResult({ response_valid: true }));
    const summary = aggregateQAResults(results);
    const report = formatQAReport(summary);

    expect(report).toContain('PASSED');
  });

  it('lists individual failure reasons in the report', () => {
    const results = [
      ...Array.from({ length: 49 }, () => makeResult({ response_valid: true })),
      makeResult({ response_valid: false, question_id: 'qa_fail_001', validation_error: 'schema_validation_failed: missing rubric_points' }),
    ];
    const summary = aggregateQAResults(results);
    const report = formatQAReport(summary);

    expect(report).toContain('qa_fail_001');
    expect(report).toContain('rubric_points');
  });
});
