/**
 * RED UNIT TESTS — TS2-04: AI Error Handling
 *
 * These tests MUST FAIL until implementation exists at:
 *   - lib/ai/errors.ts (AIError, USER_FACING_ERRORS, AIErrorCode)
 *   - lib/ai/handleAIError.ts
 *   - lib/ai/schemas/frq_grading_response.ts (parseGradingResponse)
 *
 * Gherkin source: tests/gherkin/sprint-2/technical/TS2-04_ai_error_handling.feature
 */

import { describe, it, expect } from 'vitest';

// These imports WILL FAIL until implementation exists — RED state is correct
import {
  AIError,
  USER_FACING_ERRORS,
  type AIErrorCode,
} from '@/lib/ai/errors';
import { handleAIError } from '@/lib/ai/handleAIError';
import { parseGradingResponse } from '@/lib/ai/schemas/frq_grading_response';

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — PROVIDER_UNAVAILABLE is classified and has a user-facing message
// ─────────────────────────────────────────────────────────────
describe('AIError', () => {
  it('creates an AIError with the correct code and name', () => {
    const err = new AIError(
      'PROVIDER_UNAVAILABLE',
      'openai',
      'frq_grading',
      true,
      'Provider returned 503'
    );

    expect(err.code).toBe('PROVIDER_UNAVAILABLE');
    expect(err.name).toBe('AIError');
    expect(err.provider).toBe('openai');
    expect(err.route).toBe('frq_grading');
    expect(err.retryable).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of Error (inherits correctly)', () => {
    const err = new AIError('TIMEOUT', 'groq', 'wrong_answer_explainer', true, 'timed out');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AIError);
  });

  it('sets retryable=false for non-retryable error codes', () => {
    const err = new AIError('INVALID_RESPONSE', 'openai', 'frq_grading', false, 'schema mismatch');
    expect(err.retryable).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// USER_FACING_ERRORS map — all codes must have non-empty safe messages
// ─────────────────────────────────────────────────────────────
describe('USER_FACING_ERRORS', () => {
  const ALL_ERROR_CODES: AIErrorCode[] = [
    'PROVIDER_UNAVAILABLE',
    'RATE_LIMITED',
    'TIMEOUT',
    'INVALID_RESPONSE',
    'CONTENT_FILTERED',
    'QUOTA_EXCEEDED',
    'VALIDATION_UNAVAILABLE',
  ];

  it('has a non-empty user-facing message for every AIErrorCode', () => {
    for (const code of ALL_ERROR_CODES) {
      expect(
        USER_FACING_ERRORS[code],
        `USER_FACING_ERRORS is missing message for code: "${code}"`
      ).toBeDefined();
      expect(
        USER_FACING_ERRORS[code].length,
        `USER_FACING_ERRORS["${code}"] is empty`
      ).toBeGreaterThan(10);
    }
  });

  it('does not contain error codes, provider names, or stack traces in user messages', () => {
    for (const [code, message] of Object.entries(USER_FACING_ERRORS)) {
      expect(message, `${code} message contains "503"`).not.toContain('503');
      expect(message, `${code} message contains "openai"`).not.toContain('openai');
      expect(message, `${code} message contains "groq"`).not.toContain('groq');
      expect(message, `${code} message contains "Error:"`).not.toContain('Error:');
      expect(message, `${code} message contains "stack"`).not.toContain('stack');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — handleAIError maps each AIError code to correct HTTP status
// ─────────────────────────────────────────────────────────────
describe('handleAIError', () => {
  it('returns HTTP 429 for RATE_LIMITED', async () => {
    const err = new AIError('RATE_LIMITED', 'openai', 'frq_grading', true, 'rate limited');
    const response = handleAIError(err, { route: 'frq_grading' });
    expect(response.status).toBe(429);
  });

  it('returns HTTP 503 for PROVIDER_UNAVAILABLE', async () => {
    const err = new AIError('PROVIDER_UNAVAILABLE', 'openai', 'frq_grading', true, 'down');
    const response = handleAIError(err, {});
    expect(response.status).toBe(503);
  });

  it('returns HTTP 503 for TIMEOUT', async () => {
    const err = new AIError('TIMEOUT', 'groq', 'wrong_answer_explainer', true, 'timeout');
    const response = handleAIError(err, {});
    expect(response.status).toBe(503);
  });

  it('returns HTTP 502 for INVALID_RESPONSE', async () => {
    const err = new AIError('INVALID_RESPONSE', 'openai', 'frq_grading', false, 'bad schema');
    const response = handleAIError(err, {});
    expect(response.status).toBe(502);
  });

  it('returns HTTP 400 for INPUT_TOO_LONG (if supported as AIErrorCode)', async () => {
    // This validates the story spec: INPUT_TOO_LONG → 400
    // If not in AIErrorCode, this test will fail and the type needs updating
    const err = new AIError('INPUT_TOO_LONG' as AIErrorCode, 'openai', 'frq_grading', false, 'too long');
    const response = handleAIError(err, {});
    expect(response.status).toBe(400);
  });

  it('returns HTTP 500 for unknown non-AIError exceptions', async () => {
    const genericError = new Error('Something completely unexpected');
    const response = handleAIError(genericError, {});
    expect(response.status).toBe(500);
  });

  // Gherkin: Scenario — handleAIError response body never exposes internal error details
  it('response body contains only error_code, user_message — no stack trace or internal details', async () => {
    const err = new AIError('PROVIDER_UNAVAILABLE', 'openai', 'frq_grading', true, 'raw internal message with /etc/secret/path');
    const response = handleAIError(err, { student_id: 'student-123' });
    const body = await response.json();

    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('retryable');

    // Must NOT contain internal details
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('/etc/secret/path');
    expect(bodyStr).not.toContain('raw internal message');
    expect(bodyStr).not.toContain('student-123'); // no PII in error body
  });

  it('UNKNOWN_ERROR code is used for non-AIError exceptions', async () => {
    const response = handleAIError(new TypeError('unexpected type error'), {});
    const body = await response.json();
    expect(body.error).toBe('UNKNOWN_ERROR');
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — INVALID_RESPONSE thrown when Zod schema validation fails
// ─────────────────────────────────────────────────────────────
describe('parseGradingResponse', () => {
  const validResponse = JSON.stringify({
    total_score: 4,
    max_score: 7,
    rubric_points: [
      {
        point_id: 'pt-1',
        point_description: 'Thesis',
        status: 'EARNED',
        evidence_quote: 'The war was caused by...',
        feedback: 'Strong thesis with clear line of reasoning.',
      },
    ],
    overall_feedback: 'Good effort overall. Work on contextualisation for more points.',
  });

  it('parses a valid grading response without throwing', () => {
    expect(() => parseGradingResponse(validResponse)).not.toThrow();
  });

  it('returns the parsed object with correct shape', () => {
    const result = parseGradingResponse(validResponse);
    expect(result.total_score).toBe(4);
    expect(result.max_score).toBe(7);
    expect(result.rubric_points).toHaveLength(1);
    expect(result.rubric_points[0].status).toBe('EARNED');
    expect(result.overall_feedback.length).toBeGreaterThan(20);
  });

  it('throws AIError with INVALID_RESPONSE when JSON is malformed', () => {
    expect(() => parseGradingResponse('this is not json {{{'))
      .toThrow(AIError);

    try {
      parseGradingResponse('not json');
    } catch (e) {
      expect((e as AIError).code).toBe('INVALID_RESPONSE');
    }
  });

  it('throws AIError with INVALID_RESPONSE when rubric_points is missing', () => {
    const missingField = JSON.stringify({
      total_score: 4,
      max_score: 7,
      // rubric_points missing
      overall_feedback: 'Some feedback that is long enough to pass the min length check.',
    });

    try {
      parseGradingResponse(missingField);
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as AIError).code).toBe('INVALID_RESPONSE');
    }
  });

  it('throws AIError with INVALID_RESPONSE when rubric point has invalid status', () => {
    const invalidStatus = JSON.stringify({
      total_score: 4,
      max_score: 7,
      rubric_points: [
        {
          point_id: 'pt-1',
          point_description: 'Thesis',
          status: 'MAYBE', // invalid — not in enum
          evidence_quote: null,
          feedback: 'Some feedback here.',
        },
      ],
      overall_feedback: 'Overall feedback that is long enough.',
    });

    try {
      parseGradingResponse(invalidStatus);
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as AIError).code).toBe('INVALID_RESPONSE');
    }
  });

  it('handles markdown code block wrapping that some models add', () => {
    const wrappedResponse = `\`\`\`json\n${validResponse}\n\`\`\``;
    expect(() => parseGradingResponse(wrappedResponse)).not.toThrow();
    const result = parseGradingResponse(wrappedResponse);
    expect(result.total_score).toBe(4);
  });
});
