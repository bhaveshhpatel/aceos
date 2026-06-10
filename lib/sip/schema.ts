import { z } from 'zod';

export const MasteryUnitSchema = z.object({
  mastery: z.number().min(0).max(1),
  last_reviewed: z.string().datetime(),
  fsrs_due: z.string().datetime(),
});

export const MasteryMapSchema = z.record(z.string(), z.record(z.string(), MasteryUnitSchema));

export const PredictedApScoresSchema = z.record(z.string(), z.number().min(1).max(5));

export const GpaSchema = z.object({
  current: z.number().min(0).max(5),
  projected_semester_end: z.number().min(0).max(5),
  target: z.number().min(0).max(5),
});

export const AceRankSchema = z.record(z.string(), z.number().min(0).max(1));

export const StudyPatternsSchema = z.object({
  avg_session_length_minutes: z.number().int().min(0),
  peak_study_hour: z.number().int().min(0).max(23),
  sessions_per_week: z.number().int().min(0),
});

export const StudentIntelligenceProfileSchema = z.object({
  student_id: z.string().uuid(),
  ap_subjects: z.array(z.string()),
  mastery_map: MasteryMapSchema,
  predicted_ap_scores: PredictedApScoresSchema,
  gpa: GpaSchema,
  ace_rank: AceRankSchema,
  study_patterns: StudyPatternsSchema,
});

export type StudentIntelligenceProfile = z.infer<typeof StudentIntelligenceProfileSchema>;
