/**
 * UNIT TESTS — config/flags.config.ts: isEnabled, requireFlag
 *
 * Verifies that the feature flag system works correctly and that
 * Phase 1 flags are on by default, Phase 2+ flags are off.
 */

import { describe, it, expect, vi } from 'vitest';

describe('flagsConfig — default Phase 1 flag states', () => {
  it('scoreBoostAp is enabled by default', async () => {
    const { flagsConfig } = await import('@/config/flags.config');
    expect(flagsConfig.flags.scoreBoostAp).toBe(true);
  });

  it('gradeGuard is disabled by default (Phase 2)', async () => {
    const { flagsConfig } = await import('@/config/flags.config');
    expect(flagsConfig.flags.gradeGuard).toBe(false);
  });

  it('studySensei is disabled by default (Phase 3)', async () => {
    const { flagsConfig } = await import('@/config/flags.config');
    expect(flagsConfig.flags.studySensei).toBe(false);
  });

  it('smartPack is disabled by default (Phase 4)', async () => {
    const { flagsConfig } = await import('@/config/flags.config');
    expect(flagsConfig.flags.smartPack).toBe(false);
  });
});

describe('isEnabled', () => {
  it('returns true for an enabled flag', async () => {
    const { isEnabled } = await import('@/lib/providers/flags/index');
    expect(isEnabled('scoreBoostAp')).toBe(true);
  });

  it('returns false for a disabled flag', async () => {
    const { isEnabled } = await import('@/lib/providers/flags/index');
    expect(isEnabled('gradeGuard')).toBe(false);
  });
});

describe('requireFlag', () => {
  it('does not throw for an enabled flag', async () => {
    const { requireFlag } = await import('@/lib/providers/flags/index');
    expect(() => requireFlag('scoreBoostAp')).not.toThrow();
  });

  it('throws for a disabled flag', async () => {
    const { requireFlag } = await import('@/lib/providers/flags/index');
    expect(() => requireFlag('gradeGuard')).toThrow();
  });
});
