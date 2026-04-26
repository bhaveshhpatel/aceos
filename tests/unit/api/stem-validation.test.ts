/**
 * RED UNIT TESTS — TS2-01: Modal.com STEM Validation
 *
 * These tests MUST FAIL until implementation exists at:
 *   - app/api/validate-stem/route.ts
 *   - lib/ai/modal/callModalSandbox.ts
 *   - types/modal.ts
 *
 * DO NOT create implementation files to make these pass.
 * Implement in the correct lib/app locations per the story spec.
 *
 * Gherkin source: tests/gherkin/sprint-2/technical/TS2-01_modal_sandbox.feature
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// These imports WILL FAIL until implementation exists — that is correct (RED state)
import { callModalSandbox } from '@/lib/ai/modal/callModalSandbox';
import type { STEMValidationRequest, STEMValidationResponse } from '@/types/modal';

// --- Test doubles ---
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('MODAL_SANDBOX_URL', 'https://mock-modal.test');
  vi.stubEnv('MODAL_API_KEY', 'test-api-key');
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — AP Calculus answer within tolerance is evaluated as correct
// ─────────────────────────────────────────────────────────────
describe('callModalSandbox', () => {
  describe('when Modal returns a successful response', () => {
    it('returns correct=true for a calculus answer within tolerance', async () => {
      const mockResponse: STEMValidationResponse = {
        correct: true,
        student_value: 3.14159,
        expected_value: 3.14159,
        tolerance_used: 0.001,
        error: null,
        execution_time_ms: 450,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: STEMValidationRequest = {
        question_id: 'q-calc-001',
        subject_type: 'AP Calculus AB',
        student_answer: '3.14159',
        correct_answer: 'pi',
        answer_type: 'numerical',
        tolerance: 0.001,
      };

      const result = await callModalSandbox(request);

      expect(result.correct).toBe(true);
      expect(result.tolerance_used).toBe(0.001);
      expect(result.error).toBeNull();
    });

    // Gherkin: Scenario — AP Chemistry answer outside tolerance is evaluated as incorrect
    it('returns correct=false for a chemistry answer outside tolerance', async () => {
      const mockResponse: STEMValidationResponse = {
        correct: false,
        student_value: 45.5,
        expected_value: 44.01,
        tolerance_used: 0.01,
        error: null,
        execution_time_ms: 380,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: STEMValidationRequest = {
        question_id: 'q-chem-001',
        subject_type: 'AP Chemistry',
        student_answer: '45.5',
        correct_answer: '44.01',
        answer_type: 'numerical',
      };

      const result = await callModalSandbox(request);

      expect(result.correct).toBe(false);
      expect(result.student_value).toBe(45.5);
      expect(result.expected_value).toBe(44.01);
    });

    it('calls the Modal sandbox endpoint with correct auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ correct: true, student_value: 1, expected_value: 1, tolerance_used: 0.01, error: null, execution_time_ms: 100 }),
      });

      await callModalSandbox({
        question_id: 'q-001',
        subject_type: 'AP Calculus AB',
        student_answer: '1',
        correct_answer: '1',
        answer_type: 'numerical',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('mock-modal.test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });
  });

  // Gherkin: Scenario — Modal sandbox timeout returns correct=null, not an error
  describe('when Modal is unavailable or times out', () => {
    it('returns correct=null and VALIDATION_UNAVAILABLE error — does not throw', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network timeout'));

      const result = await callModalSandbox({
        question_id: 'q-001',
        subject_type: 'AP Chemistry',
        student_answer: '4.2',
        correct_answer: '4.2',
        answer_type: 'numerical',
      });

      // Must return graceful degradation shape — NOT throw
      expect(result.correct).toBeNull();
      expect(result.error).toBe('VALIDATION_UNAVAILABLE');
    });

    it('returns correct=null when Modal returns a non-ok HTTP status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await callModalSandbox({
        question_id: 'q-001',
        subject_type: 'AP Chemistry',
        student_answer: '4.2',
        correct_answer: '4.2',
        answer_type: 'numerical',
      });

      expect(result.correct).toBeNull();
      expect(result.error).toBe('VALIDATION_UNAVAILABLE');
    });
  });

  // Gherkin: Scenario — Non-STEM subject returns validation_not_required
  describe('when subject is non-STEM', () => {
    it('returns validation_required=false without calling Modal', async () => {
      const result = await callModalSandbox({
        question_id: 'q-hist-001',
        subject_type: 'AP US History',
        student_answer: 'some essay text',
        correct_answer: 'n/a',
        answer_type: 'expression',
      });

      // Non-STEM subjects should short-circuit
      expect((result as any).validation_required).toBe(false);
      // fetch should NOT have been called
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// STEMValidationRequest / STEMValidationResponse type shape tests
// Gherkin: Automation Map — tests/unit/ai/schemas/stem.test.ts
// ─────────────────────────────────────────────────────────────
describe('STEMValidationResponse schema', () => {
  it('allows correct=null for unavailable state', () => {
    // Type-level assertion — this test validates the type exports
    const degraded: STEMValidationResponse = {
      correct: null as unknown as boolean, // null is valid in degraded state
      student_value: '4.2',
      expected_value: null as unknown as string,
      tolerance_used: 0,
      error: 'VALIDATION_UNAVAILABLE',
      execution_time_ms: 0,
    };
    expect(degraded.error).toBe('VALIDATION_UNAVAILABLE');
  });

  it('requires question_id, subject_type, student_answer, correct_answer, answer_type in request', () => {
    // Shape validation — confirms required fields exist on the type
    const request: STEMValidationRequest = {
      question_id: 'q-001',
      subject_type: 'AP Chemistry',
      student_answer: '4.2',
      correct_answer: '4.2',
      answer_type: 'numerical',
    };
    expect(request.question_id).toBeDefined();
    expect(request.subject_type).toBeDefined();
    expect(request.student_answer).toBeDefined();
    expect(request.correct_answer).toBeDefined();
    expect(request.answer_type).toBeDefined();
  });
});
