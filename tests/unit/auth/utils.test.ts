/**
 * UNIT TESTS — lib/utils.ts: getAgeFromDob
 *
 * Gherkin source: tests/gherkin/sprint-1/functional/S1-F-03_age_gate_consent.feature
 * (Age classification logic is the core of S1-F-03 — tested here at unit level)
 *
 * Implementation at: lib/utils.ts
 */

import { describe, it, expect } from 'vitest';
import { getAgeFromDob } from '@/lib/utils';

describe('getAgeFromDob', () => {
  // ── Boundary: exact 18th birthday ──────────────────────────────────────
  it('returns 18 when today is exactly the 18th birthday', () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    ).toISOString().split('T')[0];
    expect(getAgeFromDob(dob)).toBe(18);
  });

  // ── Boundary: one day before 18th birthday ──────────────────────────────
  it('returns 17 when one day before 18th birthday', () => {
    const today = new Date();
    const oneDayAfterDob = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate() + 1
    );
    const dob = oneDayAfterDob.toISOString().split('T')[0];
    expect(getAgeFromDob(dob)).toBe(17);
  });

  // ── 13 years old ────────────────────────────────────────────────────────
  it('returns 13 for a student who just turned 13', () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    ).toISOString().split('T')[0];
    expect(getAgeFromDob(dob)).toBe(13);
  });

  // ── Under 13 ─────────────────────────────────────────────────────────────
  it('returns 12 for a student who is 12', () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 12,
      today.getMonth(),
      today.getDate()
    ).toISOString().split('T')[0];
    expect(getAgeFromDob(dob)).toBe(12);
  });

  // ── Age classification helpers ───────────────────────────────────────────
  it('confirms 18+ is not classified as underage', () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 20,
      today.getMonth(),
      today.getDate()
    ).toISOString().split('T')[0];
    expect(getAgeFromDob(dob)).toBeGreaterThanOrEqual(18);
  });

  it('confirms 13–17 is in the minor-but-eligible range', () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 15,
      today.getMonth(),
      today.getDate()
    ).toISOString().split('T')[0];
    const age = getAgeFromDob(dob);
    expect(age).toBeGreaterThanOrEqual(13);
    expect(age).toBeLessThan(18);
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  it('handles leap year birthday correctly (Feb 29)', () => {
    // Born Feb 29 2008 — age should be computed without throwing
    const age = getAgeFromDob('2008-02-29');
    expect(typeof age).toBe('number');
    expect(age).toBeGreaterThan(0);
  });

  it('returns a whole integer, not a decimal', () => {
    const age = getAgeFromDob('2005-06-15');
    expect(Number.isInteger(age)).toBe(true);
  });
});
