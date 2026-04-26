/**
 * Modal.com STEM Sandbox Client
 * TS2-01 — Modal.com Python Sandbox Deployment
 *
 * Calls the deployed Modal sandbox for STEM answer validation.
 * Non-STEM subjects short-circuit without calling Modal.
 * Any network/HTTP failure returns graceful degradation (correct: null),
 * never throws — callers must not block students on validation failure.
 */

import type { STEMValidationRequest, STEMValidationResponse } from '@/types/modal';

const STEM_SUBJECTS = new Set([
  'AP Calculus AB',
  'AP Calculus BC',
  'AP Statistics',
  'AP Chemistry',
  'AP Physics 1',
  'AP Physics 2',
  'AP Physics C',
]);

const DEGRADED_RESPONSE = (request: STEMValidationRequest): STEMValidationResponse => ({
  correct: null,
  student_value: request.student_answer,
  expected_value: null,
  tolerance_used: 0,
  error: 'VALIDATION_UNAVAILABLE',
  execution_time_ms: 0,
});

export async function callModalSandbox(
  request: STEMValidationRequest
): Promise<STEMValidationResponse | { validation_required: false }> {
  // Non-STEM subjects do not need sandbox validation
  if (!STEM_SUBJECTS.has(request.subject_type)) {
    return { validation_required: false };
  }

  const modalUrl = process.env.MODAL_SANDBOX_URL;
  const apiKey = process.env.MODAL_API_KEY;

  if (!modalUrl || !apiKey) {
    return DEGRADED_RESPONSE(request);
  }

  try {
    const response = await fetch(`${modalUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return DEGRADED_RESPONSE(request);
    }

    return (await response.json()) as STEMValidationResponse;
  } catch {
    return DEGRADED_RESPONSE(request);
  }
}
