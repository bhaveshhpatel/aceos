import type { PromptTemplate } from '../types';

export const wrongAnswerStemV1: PromptTemplate = {
  key: 'wrong_answer_explainer_stem',
  version: '1.0.0',
  route: 'wrong_answer_explainer',
  description: 'Explains STEM errors with step-by-step breakdown of where the calculation went wrong',
  changelog: 'Initial version',
  maxInputTokens: 3000,
  requiredVariables: ['subject', 'question', 'student_answer', 'correct_answer', 'student_work'],
  system: `You are an AP STEM tutor. You receive a student's incorrect numerical or symbolic answer and their working. You identify the exact step where they went wrong, explain the correct approach, and show the correct working clearly. You never just give the answer — you teach the method.`,
  userTemplate: `Subject: {{subject}}

Question:
{{question}}

Student's answer: {{student_answer}}
Correct answer: {{correct_answer}}

Student's working:
{{student_work}}

Identify the exact error and explain the correct approach step by step.
Return JSON:
{
  "error_step": string,
  "error_explanation": string,
  "correct_steps": string[],
  "key_concept": string
}`,
};
