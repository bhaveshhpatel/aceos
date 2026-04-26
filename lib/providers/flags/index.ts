/**
 * Feature flag provider abstraction.
 * Import and call this — never read process.env for flags directly in components.
 */
import { flagsConfig, type FeatureFlag } from '@/config/flags.config';

export function isEnabled(flag: FeatureFlag): boolean {
  return flagsConfig.flags[flag] === true;
}

export function requireFlag(flag: FeatureFlag): void {
  if (!isEnabled(flag)) {
    throw new Error(`Feature '${flag}' is not enabled in this environment.`);
  }
}
