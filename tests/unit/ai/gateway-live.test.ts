import { describe, it, expect, vi } from 'vitest';
import { callAI } from '@/lib/ai/gateway';

describe('AI Gateway Failover with OpenRouter & Groq Provider Keys', () => {
  it('successfully routes via Groq key when OpenAI key is absent', async () => {
    const originalOpenAI = process.env.OPENAI_API_KEY;
    const originalGroq = process.env.GROQ_API_KEY;

    delete process.env.OPENAI_API_KEY;
    process.env.GROQ_API_KEY = 'mock-groq-key';

    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '[{"id":"1","question":"Groq Question"}]' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    } as any);

    try {
      const res = await callAI({
        route: 'exam_generation',
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      expect(res.provider).toBe('groq');
      expect(res.content).toContain('Groq Question');
    } finally {
      global.fetch = globalFetch;
      if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
      if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
      else delete process.env.GROQ_API_KEY;
    }
  });

  it('successfully routes via OpenRouter key when OpenAI and Groq keys are absent', async () => {
    const originalOpenAI = process.env.OPENAI_API_KEY;
    const originalGroq = process.env.GROQ_API_KEY;
    const originalOpenRouter = process.env.OPENROUTER_API_KEY;

    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    process.env.OPENROUTER_API_KEY = 'mock-openrouter-key';

    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '[{"id":"2","question":"OpenRouter Question"}]' } }],
        usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
      }),
    } as any);

    try {
      const res = await callAI({
        route: 'exam_generation',
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      expect(res.provider).toBe('openrouter');
      expect(res.content).toContain('OpenRouter Question');
    } finally {
      global.fetch = globalFetch;
      if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
      if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
      if (originalOpenRouter) process.env.OPENROUTER_API_KEY = originalOpenRouter;
      else delete process.env.OPENROUTER_API_KEY;
    }
  });
});
