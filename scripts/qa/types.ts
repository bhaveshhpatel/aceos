/**
 * QA Pipeline Types
 * TS2-05 — Internal QA Pipeline
 */

export interface QAResult {
  question_id: string;
  subject: string;
  question_type: 'mcq' | 'frq' | 'stem_mcq';
  pipeline_route: string;
  model_used: string;
  latency_ms: number;
  response_valid: boolean;
  validation_error?: string;
  stem_sandbox_used: boolean;
  stem_sandbox_result?: boolean | null;
  raw_response: string;
  parsed_response?: unknown;
}

export interface QASummary {
  total: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
  failures: QAResult[];
  p95_latency_ms: number;
}
