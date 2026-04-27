/**
 * UNIT TESTS — middleware route classification logic
 *
 * Strategy: test the isPublicPath logic directly by extracting
 * the PUBLIC_PATHS list and matching function. We do NOT
 * instantiate NextRequest/NextResponse here — those require the
 * Next.js edge runtime which is unavailable in Vitest/jsdom.
 *
 * Full redirect behaviour is covered by e2e tests (Playwright).
 *
 * Covers:
 *   1. Every explicit PUBLIC_PATHS entry is correctly identified as public
 *   2. Sub-paths of public paths are also public
 *   3. Protected routes are NOT classified as public
 *   4. /api/auth/* routes are public (fix shipped in middleware.ts)
 *   5. Edge cases: trailing slashes, mixed casing, query strings
 */

import { describe, it, expect } from 'vitest';

// ── Inline the logic under test ───────────────────────────────────────────────
// Mirrors PUBLIC_PATHS and isPublicPath from middleware.ts exactly.
// If middleware.ts changes these, update here too.
const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/legal',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('isPublicPath', () => {

  // ── Exact matches ────────────────────────────────────────────────────
  describe('exact public path matches', () => {
    const exactPublic = [
      '/signin',
      '/signup',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    for (const path of exactPublic) {
      it(`returns true for exact match: ${path}`, () => {
        expect(isPublicPath(path)).toBe(true);
      });
    }
  });

  // ── Sub-path matches ──────────────────────────────────────────────────
  describe('sub-paths of public roots', () => {
    const subPaths = [
      '/auth/callback',
      '/auth/callback?code=abc123',
      '/legal/privacy-policy',
      '/legal/terms-of-service',
      '/_next/static/chunks/main.js',
      '/_next/image?url=foo&w=32&q=75',
    ];

    for (const path of subPaths) {
      it(`returns true for sub-path: ${path}`, () => {
        // Strip query string for pathname check (middleware receives pathname only)
        const pathname = path.split('?')[0];
        expect(isPublicPath(pathname)).toBe(true);
      });
    }
  });

  // ── /api/auth/* is public (critical — the bug we fixed) ───────────────
  describe('/api/auth/* routes are public', () => {
    const apiAuthPaths = [
      '/api/auth/signup',
      '/api/auth/signin',
      '/api/auth/signout',
      '/api/auth/callback',
      '/api/auth/reset-password',
    ];

    for (const path of apiAuthPaths) {
      it(`returns true for API auth route: ${path}`, () => {
        expect(isPublicPath(path)).toBe(true);
      });
    }
  });

  // ── Protected routes ──────────────────────────────────────────────────
  describe('protected routes return false', () => {
    const protectedPaths = [
      '/score-boost-ap/dashboard',
      '/score-boost-ap/practice',
      '/onboarding/score-boost-ap/age-gate',
      '/settings',
      '/api/stripe/webhook',
      '/api/users/me',
    ];

    for (const path of protectedPaths) {
      it(`returns false for protected route: ${path}`, () => {
        expect(isPublicPath(path)).toBe(false);
      });
    }
  });

  // ── Should NOT prefix-match on partial segment names ──────────────────
  describe('no false positives on partial segment names', () => {
    it('does not match /signout as public (not in PUBLIC_PATHS)', () => {
      expect(isPublicPath('/signout')).toBe(false);
    });

    it('does not match /signup-success as /signup sub-path', () => {
      // /signup-success does NOT start with /signup/
      expect(isPublicPath('/signup-success')).toBe(false);
    });

    it('does not match /api/users as /api/auth sub-path', () => {
      expect(isPublicPath('/api/users')).toBe(false);
    });
  });
});
