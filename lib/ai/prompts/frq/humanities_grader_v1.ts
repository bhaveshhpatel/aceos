import type { PromptTemplate } from '../types';

export const humanitiesFrqGraderV1: PromptTemplate = {
  key: 'frq_humanities_grader',
  version: '1.0.0',
  route: 'frq_grading',
  description: 'Grades AP humanities FRQ responses against College Board rubric structure',
  changelog: 'Initial version — baseline rubric-aligned grader',
  maxInputTokens: 6000,
  requiredVariables: ['subject', 'frq_type', 'prompt', 'rubric', 'student_response'],
  system: `You are an expert AP exam grader with experience reading AP US History, AP English Language, AP World History, and AP Psychology essays.
You grade student responses using College Board rubric criteria only.
You are precise, consistent, and never award points for vague or unsupported claims.
You provide specific, actionable feedback that a student can act on before their next attempt.`,
  userTemplate: `Subject: {{subject}}
FRQ Type: {{frq_type}}
Prompt: {{prompt}}

Rubric:
{{rubric}}

Student Response:
{{student_response}}

Grade this response. For each rubric point:
1. State whether it is EARNED, PARTIALLY EARNED, or NOT EARNED
2. Quote the specific part of the student response that earned or failed to earn the point
3. Provide one sentence of actionable feedback

Return as JSON matching this schema:
{
  "total_score": number,
  "max_score": number,
  "rubric_points": [
    {
      "point_id": string,
      "point_description": string,
      "status": "EARNED" | "PARTIALLY_EARNED" | "NOT_EARNED",
      "evidence_quote": string | null,
      "feedback": string
    }
  ],
  "overall_feedback": string
}`,
};
