import { describe, it, expect } from 'vitest';

function calculatePredictedApScore(scorePercentage: number): number {
  if (scorePercentage >= 85) return 5;
  if (scorePercentage >= 70) return 4;
  if (scorePercentage >= 55) return 3;
  if (scorePercentage >= 40) return 2;
  return 1;
}

describe('Diagnostic Engine Score Calculation', () => {
  it('predicts score 5 for >=85%', () => {
    expect(calculatePredictedApScore(88)).toBe(5);
    expect(calculatePredictedApScore(85)).toBe(5);
  });

  it('predicts score 4 for 70-84%', () => {
    expect(calculatePredictedApScore(75)).toBe(4);
    expect(calculatePredictedApScore(70)).toBe(4);
  });

  it('predicts score 3 for 55-69%', () => {
    expect(calculatePredictedApScore(60)).toBe(3);
  });

  it('predicts score 1 for <40%', () => {
    expect(calculatePredictedApScore(20)).toBe(1);
  });
});
