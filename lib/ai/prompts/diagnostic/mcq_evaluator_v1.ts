import type { PromptTemplate } from '../types';

export const mcqEvaluatorV1: PromptTemplate = {
  key: 'mcq_evaluator',
  version: '1.0.0',
  route: 'diagnostic_mcq',
  description: 'Evaluates a student MCQ answer and explains why the correct answer is right',
  changelog: 'Initial version',
  maxInputTokens: 2000,
  requiredVariables: ['subject', 'question', 'choices', 'student_choice', 'correct_choice'],
  system: `You are an AP exam content expert. When a student gets an MCQ wrong, you explain clearly and concisely why the correct answer is right and why the student's choice was incorrect. You never make the student feel bad — you frame everything as a learning opportunity.`,
  userTemplate: `Subject: {{subject}}

Question:
{{question}}

Answer Choices:
{{choices}}

Student selected: {{student_choice}}
Correct answer: {{correct_choice}}

In 2-3 sentences:
1. Explain why {{correct_choice}} is correct
2. Explain the specific misconception behind choosing {{student_choice}}

Return JSON:
{
  "correct_choice": string,
  "student_choice": string,
  "explanation": string,
  "misconception": string
}`,
};
