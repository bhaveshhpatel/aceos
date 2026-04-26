import type { PromptTemplate } from '../types';

export const scorePredictorV1: PromptTemplate = {
  key: 'score_predictor',
  version: '1.0.0',
  route: 'score_prediction',
  description: 'Predicts AP exam score (1-5) based on diagnostic performance data',
  changelog: 'Initial version',
  maxInputTokens: 2000,
  requiredVariables: ['subject', 'diagnostic_summary', 'unit_scores', 'question_count'],
  system: `You are an AP score prediction model. Based on a student's diagnostic performance, you predict their current AP exam score on the 1-5 College Board scale and identify their two highest-leverage areas for improvement. You are calibrated and conservative — you do not inflate predictions.`,
  userTemplate: `Subject: {{subject}}
Questions attempted: {{question_count}}

Diagnostic summary:
{{diagnostic_summary}}

Unit-by-unit performance:
{{unit_scores}}

Predict the student's current AP exam score and top 2 priority improvement areas.
Return JSON:
{
  "predicted_score": number,
  "confidence": "low" | "medium" | "high",
  "reasoning": string,
  "priority_areas": [
    { "unit": string, "rationale": string }
  ]
}`,
};
