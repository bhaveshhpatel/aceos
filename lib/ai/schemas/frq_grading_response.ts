/**
 * Zod schema for FRQ grading response validation
 * TS2-04 — AI Error Handling
 *
 * parseGradingResponse is the single parse point for all LLM grading output.
 * Handles markdown code block wrapping that some models add.
 * Throws AIError(INVALID_RESPONSE) on any parse or schema failure.
 */

import { z } from 'zod';
import { AIError } from '@/lib/ai/errors';

export const rubricPointSchema = z.object({
  point_id: z.string(),
  point_description: z.string(),
  status: z.enum(['EARNED', 'PARTIALLY_EARNED', 'NOT_EARNED']),
  evidence_quote: z.string().nullable(),
  feedback: z.string().min(10),
});

export const frqGradingResponseSchema = z.object({
  total_score: z.number().min(0),
  max_score: z.number().min(1),
  rubric_points: z.array(rubricPointSchema).min(1),
  overall_feedback: z.string().min(20),
});

export type FRQGradingResponse = z.infer<typeof frqGradingResponseSchema>;

export function parseGradingResponse(raw: string): FRQGradingResponse {
  let parsed: unknown;

  try {
    // Strip markdown code blocks that some models wrap JSON in
    const jsonStr = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AIError(
      'INVALID_RESPONSE',
      'parser',
      'frq_grading',
      false,
      'LLM response was not valid JSON'
    );
  }

  const result = frqGradingResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIError(
      'INVALID_RESPONSE',
      'parser',
      'frq_grading',
      false,
      `Response schema validation failed: ${result.error.message}`
    );
  }

  return result.data;
}
