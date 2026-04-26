import type { PromptTemplate } from '../types';

export const wrongAnswerTextV1: PromptTemplate = {
  key: 'wrong_answer_explainer_text',
  version: '1.0.0',
  route: 'wrong_answer_explainer',
  description: 'Explains why a student got a text-based FRQ point wrong and what to do differently',
  changelog: 'Initial version',
  maxInputTokens: 3000,
  requiredVariables: ['subject', 'rubric_point', 'student_response_excerpt', 'feedback'],
  system: `You are an AP tutoring coach. You receive a student's incorrect response excerpt and the grader's feedback. You explain in plain, encouraging language exactly what the student needs to do differently to earn this point. You never repeat the feedback verbatim — you translate it into student-friendly language with a concrete example.`,
  userTemplate: `Subject: {{subject}}

Rubric point the student missed:
{{rubric_point}}

Student's response excerpt:
{{student_response_excerpt}}

Grader feedback:
{{feedback}}

Write a 2-3 sentence explanation for the student. Explain:
1. What they were missing
2. One concrete thing to add or change in their next attempt

Return JSON:
{
  "explanation": string,
  "example_improvement": string
}`,
};
