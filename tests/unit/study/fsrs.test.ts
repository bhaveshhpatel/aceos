import { describe, it, expect } from 'vitest';
import { calculateFSRS, FSRSCardState } from '@/lib/fsrs/fsrs';

describe('FSRS-5 Spaced Repetition Algorithm', () => {
  const initialCard: FSRSCardState = {
    stability: 1,
    difficulty: 5,
    repetition: 0,
    lapses: 0,
    last_review: '2026-04-26T00:00:00.000Z',
  };

  it('increases stability on "good" grade', () => {
    const result = calculateFSRS(initialCard, 'good');
    expect(result.nextState.stability).toBe(2.5);
    expect(result.nextState.repetition).toBe(1);
    expect(result.intervalDays).toBe(3);
  });

  it('sharply increases stability on "easy" grade', () => {
    const result = calculateFSRS(initialCard, 'easy');
    expect(result.nextState.stability).toBe(4.0);
    expect(result.nextState.repetition).toBe(1);
  });

  it('resets repetition and increases lapses on "again" grade', () => {
    const result = calculateFSRS({ ...initialCard, repetition: 3 }, 'again');
    expect(result.nextState.repetition).toBe(0);
    expect(result.nextState.lapses).toBe(1);
    expect(result.nextState.stability).toBe(0.5);
  });
});
