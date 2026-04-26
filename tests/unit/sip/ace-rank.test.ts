/**
 * UNIT TESTS — lib/sip/ace-rank.ts
 *
 * The ACE-Rank formula is a core non-negotiable from PROJECT_CONTEXT.md:
 *   ACE-Rank = Weight × (DaysUntilDue)^-1 × (1 - Mastery)
 *
 * These tests lock in the formula behaviour.
 * Any change to ace-rank.ts that breaks these tests is a product regression.
 */

import { describe, it, expect } from 'vitest';
import { computeAceRank, rankUnits, type RankInput } from '@/lib/sip/ace-rank';

describe('computeAceRank', () => {
  // ── Formula correctness ───────────────────────────────────────────────────
  it('computes the correct rank for a known input', () => {
    // weight=1.0, daysUntilDue=10, mastery=0.5
    // ACE-Rank = 1.0 × (1/10) × (1 - 0.5) = 0.05
    const rank = computeAceRank({
      unitSlug:     'unit-1',
      subjectSlug:  'ap-calc-bc',
      masteryScore: 0.5,
      daysUntilDue: 10,
      weight:       1.0,
    });
    expect(rank).toBeCloseTo(0.05, 5);
  });

  it('gives higher rank to lower mastery (same weight and days)', () => {
    const lowMastery  = computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 0.1, daysUntilDue: 10, weight: 1 });
    const highMastery = computeAceRank({ unitSlug: 'u2', subjectSlug: 's', masteryScore: 0.9, daysUntilDue: 10, weight: 1 });
    expect(lowMastery).toBeGreaterThan(highMastery);
  });

  it('gives higher rank when fewer days remain (same mastery and weight)', () => {
    const urgent  = computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 0.5, daysUntilDue: 2,  weight: 1 });
    const distant = computeAceRank({ unitSlug: 'u2', subjectSlug: 's', masteryScore: 0.5, daysUntilDue: 30, weight: 1 });
    expect(urgent).toBeGreaterThan(distant);
  });

  it('gives higher rank for higher weight exam (same mastery and days)', () => {
    const highWeight = computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 0.5, daysUntilDue: 10, weight: 1.0 });
    const lowWeight  = computeAceRank({ unitSlug: 'u2', subjectSlug: 's', masteryScore: 0.5, daysUntilDue: 10, weight: 0.3 });
    expect(highWeight).toBeGreaterThan(lowWeight);
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  it('returns 0 when mastery is 1.0 (fully mastered)', () => {
    const rank = computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 1.0, daysUntilDue: 5, weight: 1 });
    expect(rank).toBe(0);
  });

  it('does not divide by zero when daysUntilDue is 0 (due today)', () => {
    expect(() =>
      computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 0.5, daysUntilDue: 0, weight: 1 })
    ).not.toThrow();
  });

  it('does not produce negative rank for overdue items (daysUntilDue < 0)', () => {
    const rank = computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 0.5, daysUntilDue: -5, weight: 1 });
    expect(rank).toBeGreaterThan(0);
  });

  it('returns a finite number for all valid inputs', () => {
    const rank = computeAceRank({ unitSlug: 'u1', subjectSlug: 's', masteryScore: 0.0, daysUntilDue: 1, weight: 0.5 });
    expect(Number.isFinite(rank)).toBe(true);
  });
});

describe('rankUnits', () => {
  const inputs: RankInput[] = [
    { unitSlug: 'limits',        subjectSlug: 'ap-calc-bc', masteryScore: 0.8, daysUntilDue: 30, weight: 1.0 },
    { unitSlug: 'integration',   subjectSlug: 'ap-calc-bc', masteryScore: 0.2, daysUntilDue: 5,  weight: 1.0 },
    { unitSlug: 'series',        subjectSlug: 'ap-calc-bc', masteryScore: 0.5, daysUntilDue: 10, weight: 1.0 },
  ];

  it('returns the same number of items as input', () => {
    const ranked = rankUnits(inputs);
    expect(ranked.length).toBe(3);
  });

  it('sorts units by aceRank descending (highest priority first)', () => {
    const ranked = rankUnits(inputs);
    expect(ranked[0].aceRank).toBeGreaterThanOrEqual(ranked[1].aceRank);
    expect(ranked[1].aceRank).toBeGreaterThanOrEqual(ranked[2].aceRank);
  });

  it('the highest priority unit is integration (low mastery + close due date)', () => {
    const ranked = rankUnits(inputs);
    expect(ranked[0].unitSlug).toBe('integration');
  });

  it('attaches aceRank property to every returned item', () => {
    const ranked = rankUnits(inputs);
    for (const item of ranked) {
      expect(typeof item.aceRank).toBe('number');
      expect(Number.isFinite(item.aceRank)).toBe(true);
    }
  });

  it('returns empty array for empty input', () => {
    expect(rankUnits([])).toEqual([]);
  });
});
