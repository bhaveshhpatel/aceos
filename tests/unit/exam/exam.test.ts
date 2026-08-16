import { describe, it, expect } from 'vitest';

function calculateExamApScore(percentage: number): number {
  if (percentage >= 80) return 5;
  if (percentage >= 65) return 4;
  if (percentage >= 50) return 3;
  if (percentage >= 35) return 2;
  return 1;
}

describe('Bluebook Exam Score Calculation', () => {
  it('calculates score 5 for >=80%', () => {
    expect(calculateExamApScore(82)).toBe(5);
  });

  it('calculates score 4 for 65-79%', () => {
    expect(calculateExamApScore(70)).toBe(4);
  });

  it('calculates score 3 for 50-64%', () => {
    expect(calculateExamApScore(55)).toBe(3);
  });

  it('calculates score 1 for <35%', () => {
    expect(calculateExamApScore(30)).toBe(1);
  });
});
