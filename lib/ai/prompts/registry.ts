/**
 * Prompt Registry
 * TS2-03 — Versioned Prompt Template System
 *
 * Maps every prompt key to its current active version.
 * To upgrade a prompt: add the new version file and update the import here.
 * No other files need to change.
 */

import type { PromptTemplate } from './types';

import { humanitiesFrqGraderV1 } from './frq/humanities_grader_v1';
import { stemGraderV1 } from './frq/stem_grader_v1';
import { mcqEvaluatorV1 } from './diagnostic/mcq_evaluator_v1';
import { scorePredictorV1 } from './diagnostic/score_predictor_v1';
import { wrongAnswerTextV1 } from './explainer/wrong_answer_text_v1';
import { wrongAnswerStemV1 } from './explainer/wrong_answer_stem_v1';
import { studyPlanGeneratorV1 } from './study_plan/generator_v1';

export const promptRegistry: Record<string, PromptTemplate> = {
  frq_humanities_grader:       humanitiesFrqGraderV1,
  frq_stem_grader:             stemGraderV1,
  mcq_evaluator:               mcqEvaluatorV1,
  score_predictor:             scorePredictorV1,
  wrong_answer_explainer_text: wrongAnswerTextV1,
  wrong_answer_explainer_stem: wrongAnswerStemV1,
  study_plan_generator:        studyPlanGeneratorV1,
};
