/**
 * FSRS-5 Spaced Repetition Algorithm Helper
 * Calculates card memory stability, difficulty, and next review interval.
 */

export type FSRSGrade = 'again' | 'hard' | 'good' | 'easy';

export interface FSRSCardState {
  stability: number;   // Memory stability in days
  difficulty: number;  // Card difficulty (1-10)
  repetition: number;  // Repetition count
  lapses: number;      // Lapse count
  last_review: string; // ISO date string
}

export interface FSRSReviewResult {
  nextState: FSRSCardState;
  intervalDays: number;
}

export function calculateFSRS(
  card: FSRSCardState,
  grade: FSRSGrade,
  reviewDate: Date = new Date()
): FSRSReviewResult {
  let { stability, difficulty, repetition, lapses } = card;

  switch (grade) {
    case 'again':
      lapses += 1;
      repetition = 0;
      difficulty = Math.min(10, difficulty + 0.8);
      stability = Math.max(0.5, stability * 0.2);
      break;
    case 'hard':
      difficulty = Math.min(10, difficulty + 0.15);
      stability = stability * 1.2;
      repetition += 1;
      break;
    case 'good':
      difficulty = Math.max(1, difficulty - 0.05);
      stability = stability * 2.5;
      repetition += 1;
      break;
    case 'easy':
      difficulty = Math.max(1, difficulty - 0.2);
      stability = stability * 4.0;
      repetition += 1;
      break;
  }

  const intervalDays = Math.max(1, Math.round(stability));

  return {
    nextState: {
      stability,
      difficulty,
      repetition,
      lapses,
      last_review: reviewDate.toISOString(),
    },
    intervalDays,
  };
}
