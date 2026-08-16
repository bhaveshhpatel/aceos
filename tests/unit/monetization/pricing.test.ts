import { describe, it, expect } from 'vitest';

function isFeatureAllowed(tier: 'free' | 'pro', feature: 'diagnostic' | 'unlimited_frq'): boolean {
  if (tier === 'pro') return true;
  return feature === 'diagnostic';
}

describe('Pricing Tier Feature Gating', () => {
  it('allows free tier access to diagnostic', () => {
    expect(isFeatureAllowed('free', 'diagnostic')).toBe(true);
  });

  it('blocks free tier from unlimited FRQ grading', () => {
    expect(isFeatureAllowed('free', 'unlimited_frq')).toBe(false);
  });

  it('allows pro tier access to all features', () => {
    expect(isFeatureAllowed('pro', 'unlimited_frq')).toBe(true);
  });
});
