/**
 * RED UNIT TESTS — TS2-02: LiteLLM AI Gateway
 *
 * These tests MUST FAIL until implementation exists at:
 *   - lib/ai/gateway.ts (callAI, AIGatewayError)
 *   - model_map.json (routing config)
 *
 * DO NOT create implementation files to make these pass.
 *
 * Gherkin source: tests/gherkin/sprint-2/technical/TS2-02_litellm_gateway.feature
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// These imports WILL FAIL until implementation exists — RED state is correct
import { callAI, AIGatewayError } from '@/lib/ai/gateway';
import type { AIRequest, AIResponse } from '@/lib/ai/gateway';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockSuccessResponse = (content = 'AI response text', model = 'gpt-4o') => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content } }],
    model,
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
  vi.stubEnv('GROQ_API_KEY', 'test-groq-key');
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — callAI routes frq_grading to correct model
// ─────────────────────────────────────────────────────────────
describe('callAI routing', () => {
  it('routes frq_grading to the OpenAI endpoint with gpt-4o', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse('graded response', 'gpt-4o'));

    await callAI({
      route: 'frq_grading',
      messages: [{ role: 'user', content: 'Grade this essay' }],
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('api.openai.com');
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('gpt-4o');
    expect(body.temperature).toBe(0.2);
  });

  // Gherkin: Scenario — Changing model in model_map.json re-routes calls
  it('routes wrong_answer_explainer to the Groq endpoint', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse('explanation', 'llama-3.3-70b-versatile'));

    await callAI({
      route: 'wrong_answer_explainer',
      messages: [{ role: 'user', content: 'Explain this' }],
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('api.groq.com');
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('llama-3.3-70b-versatile');
  });

  it('uses the fallback route for an unknown route key without throwing', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse('fallback response', 'gpt-4o-mini'));

    // An unknown route should use fallback, not throw
    const result = await callAI({
      route: 'nonexistent_route_xyz' as any,
      messages: [{ role: 'user', content: 'test' }],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(result.content).toBeDefined();
  });

  it('returns structured AIResponse with model_used, provider, usage, latency_ms', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse('response'));

    const result = await callAI({
      route: 'frq_grading',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result.content).toBe('response');
    expect(result.model_used).toBeDefined();
    expect(result.provider).toBeDefined();
    expect(result.usage.prompt_tokens).toBeTypeOf('number');
    expect(result.usage.completion_tokens).toBeTypeOf('number');
    expect(result.latency_ms).toBeTypeOf('number');
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — callAI retries on 429 with exponential backoff
// ─────────────────────────────────────────────────────────────
describe('callAI retry behaviour', () => {
  it('retries twice on HTTP 429 before succeeding on third attempt', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce(mockSuccessResponse('success on third'));

    const result = await callAI({
      route: 'frq_grading',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.content).toBe('success on third');
  });

  // Gherkin: Scenario — callAI throws PROVIDER_UNAVAILABLE after max retries exhausted
  it('throws AIGatewayError after all retries are exhausted on 500', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'server error' }) });

    await expect(
      callAI({
        route: 'frq_grading',
        messages: [{ role: 'user', content: 'test' }],
      })
    ).rejects.toThrow(AIGatewayError);

    // Should have tried initial + 2 retries = 3 total calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('AIGatewayError contains the status code and provider', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

    try {
      await callAI({
        route: 'frq_grading',
        messages: [{ role: 'user', content: 'test' }],
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIGatewayError);
      expect((err as AIGatewayError).statusCode).toBe(503);
      expect((err as AIGatewayError).provider).toBe('openai');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Gherkin: Scenario — Every successful AI call is logged to ai_usage_log
// ─────────────────────────────────────────────────────────────
describe('callAI usage logging', () => {
  it('calls logAIUsage after a successful response without blocking return', async () => {
    // logAIUsage is fire-and-forget — we spy via module mock
    const logSpy = vi.fn().mockResolvedValue(undefined);
    vi.mock('@/lib/ai/logAIUsage', () => ({ logAIUsage: logSpy }));

    mockFetch.mockResolvedValueOnce(mockSuccessResponse());

    const result = await callAI({
      route: 'frq_grading',
      messages: [{ role: 'user', content: 'test' }],
      metadata: { student_id: 'student-uuid', question_id: 'q-001' },
    });

    // Response must be returned — logging is non-blocking
    expect(result.content).toBeDefined();
    // logAIUsage should have been called (may be async)
    // We check it was called at some point (not awaited by callAI)
    await vi.runAllTimersAsync();
    // logSpy may be called async — assert it was scheduled
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'frq_grading',
        model: expect.any(String),
        provider: expect.any(String),
        prompt_tokens: expect.any(Number),
        completion_tokens: expect.any(Number),
        latency_ms: expect.any(Number),
      })
    );
  });

  it('a logging failure does NOT throw or affect the returned response', async () => {
    vi.mock('@/lib/ai/logAIUsage', () => ({
      logAIUsage: vi.fn().mockRejectedValue(new Error('DB write failed')),
    }));

    mockFetch.mockResolvedValueOnce(mockSuccessResponse('success despite log failure'));

    // Should NOT throw even when logging fails
    await expect(
      callAI({
        route: 'frq_grading',
        messages: [{ role: 'user', content: 'test' }],
      })
    ).resolves.toBeDefined();
  });
});
