/**
 * ACE-Rank algorithm
 * Priority score formula (from PROJECT_CONTEXT.md):
 *
 *   ACE-Rank = Weight × (DaysUntilDue)^-1 × (1 - Mastery)
 *
 * Higher score = higher study priority.
 * Never expose the formula to students — surface only the ranked list.
 */

export interface RankInput {
  unitSlug:         string;
  subjectSlug:      string;
  masteryScore:     number;   // 0.0 – 1.0
  daysUntilDue:     number;   // days until exam or FSRS due date
  weight:           number;   // AP exam weight (0.0 – 1.0) or grade weight
}

export interface RankedUnit extends RankInput {
  aceRank: number;
}

export function computeAceRank(input: RankInput): number {
  const { weight, daysUntilDue, masteryScore } = input;
  // Guard: if due today or overdue, treat as 1 day to avoid division by zero / negative
  const safeDays = Math.max(daysUntilDue, 1);
  return weight * (1 / safeDays) * (1 - masteryScore);
}

export function rankUnits(inputs: RankInput[]): RankedUnit[] {
  return inputs
    .map(input => ({ ...input, aceRank: computeAceRank(input) }))
    .sort((a, b) => b.aceRank - a.aceRank);
}
