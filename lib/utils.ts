/**
 * Utility helpers used across the frontend.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Use this instead of raw string concatenation in components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Calculates age in years from a date of birth string (YYYY-MM-DD).
 *
 * UTC-safe: parses dob as UTC midnight and compares against UTC today.
 * This ensures the result is identical in every timezone and in CI,
 * which is critical for the exact-18-birthday boundary (AC-05b/c).
 *
 * Boundary contract:
 *   - Birthday IS today (UTC)  → age >= 18 returns true  → adult
 *   - Birthday is tomorrow     → age is 17               → minor
 */
export function getAgeFromDob(dob: string): number {
  // Parse dob as UTC midnight to avoid local-timezone date shifting.
  // e.g. '2008-04-26' on a UTC-7 machine must not become April 25.
  const [year, month, day] = dob.split('-').map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let age = todayUTC.getUTCFullYear() - birth.getUTCFullYear();
  const m = todayUTC.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && todayUTC.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}
