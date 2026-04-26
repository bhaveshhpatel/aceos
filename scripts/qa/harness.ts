/**
 * QA Pipeline Harness Utilities
 * TS2-05 — Internal QA Pipeline
 *
 * Pure logic — no I/O, no AI calls.
 * runPipelineAudit (in pipeline_audit.ts) uses these to aggregate results.
 */

import type { QAResult, QASummary } from './types';

export { QAResult, QASummary };

export function computePassRate(passCount: number, total: number): number {
  if (total === 0) return 0;
  return passCount / total;
}

export function aggregateQAResults(results: QAResult[]): QASummary {
  const failures = results.filter((r) => !r.response_valid);
  const passCount = results.length - failures.length;

  const sortedLatencies = [...results].map((r) => r.latency_ms).sort((a, b) => a - b);
  const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
  const p95LatencyMs = sortedLatencies[Math.max(0, p95Index)] ?? 0;

  return {
    total: results.length,
    pass_count: passCount,
    fail_count: failures.length,
    pass_rate: computePassRate(passCount, results.length),
    failures,
    p95_latency_ms: p95LatencyMs,
  };
}

const PASS_THRESHOLD = 0.9; // 45/50

export function formatQAReport(summary: QASummary): string {
  const pct = Math.round(summary.pass_rate * 100);
  const status = summary.pass_rate >= PASS_THRESHOLD ? 'PASSED' : 'FAILED';

  const lines: string[] = [
    `Sprint 2 QA Audit — ${status}`,
    `Results: ${summary.pass_count}/${summary.total} passed (${pct}%) | Threshold: 90%`,
    `P95 Latency: ${summary.p95_latency_ms}ms`,
    '',
  ];

  if (summary.failures.length > 0) {
    lines.push(`Failures (${summary.fail_count}):`);
    for (const f of summary.failures) {
      lines.push(`  [${f.question_id}] ${f.subject} — ${f.validation_error ?? 'unknown error'}`);
    }
  }

  return lines.join('\n');
}
