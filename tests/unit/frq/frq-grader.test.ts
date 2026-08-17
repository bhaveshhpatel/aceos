import { describe, it, expect } from 'vitest';
import { parseGradingResponse } from '@/lib/ai/schemas/frq_grading_response';

describe('FRQ Grader Response Parser', () => {
  it('parses valid AI JSON response', () => {
    const rawJson = JSON.stringify({
      total_score: 5,
      max_score: 6,
      rubric_points: [
        {
          point_id: 'p1',
          point_description: 'Thesis',
          status: 'EARNED',
          evidence_quote: 'The Civil War was primarily caused by...',
          feedback: 'Clear defensible thesis statement provided.',
        },
      ],
      overall_feedback: 'Strong response with solid historical argumentation.',
    });

    const parsed = parseGradingResponse(rawJson);
    expect(parsed.total_score).toBe(5);
    expect(parsed.rubric_points[0].status).toBe('EARNED');
  });

  it('strips markdown code blocks prior to parsing', () => {
    const markdownWrapped = `\`\`\`json
{
  "total_score": 4,
  "max_score": 6,
  "rubric_points": [
    {
      "point_id": "p1",
      "point_description": "Thesis",
      "status": "EARNED",
      "evidence_quote": "Quote",
      "feedback": "Sufficient thesis analysis."
    }
  ],
  "overall_feedback": "Well written response overall."
}
\`\`\``;

    const parsed = parseGradingResponse(markdownWrapped);
    expect(parsed.total_score).toBe(4);
  });
});
