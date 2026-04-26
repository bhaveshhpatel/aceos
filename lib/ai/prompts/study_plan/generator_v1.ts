import type { PromptTemplate } from '../types';

export const studyPlanGeneratorV1: PromptTemplate = {
  key: 'study_plan_generator',
  version: '1.0.0',
  route: 'study_plan_generation',
  description: 'Generates a personalised AP study plan based on diagnostic results and exam date',
  changelog: 'Initial version',
  maxInputTokens: 3000,
  requiredVariables: ['subject', 'exam_date', 'weak_units', 'strong_units', 'predicted_score', 'target_score'],
  system: `You are an AP study strategist. You create personalised, realistic study plans that prioritise high-leverage topics given the student's time until the AP exam. You are direct and practical — you do not pad plans with low-priority tasks. You always anchor recommendations to specific AP exam units.`,
  userTemplate: `Subject: {{subject}}
AP Exam date: {{exam_date}}
Current predicted score: {{predicted_score}}
Target score: {{target_score}}

Weak units (prioritise these):
{{weak_units}}

Strong units (maintenance only):
{{strong_units}}

Generate a weekly study plan from today until the exam date.
Return JSON:
{
  "weeks_available": number,
  "weekly_plan": [
    {
      "week": number,
      "focus_units": string[],
      "tasks": string[],
      "estimated_hours": number
    }
  ],
  "exam_week_strategy": string
}`,
};
