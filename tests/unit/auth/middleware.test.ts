/**
 * UNIT TESTS — middleware.ts (route classification + routing decisions)
 * Tech debt payoff — Sprint 1
 *
 * WHY NOT NextRequest/NextResponse:
 *   Vitest runs under jsdom. NextResponse.next({ request: { headers } })
 *   requires the Next.js edge runtime and throws:
 *   "request.headers must be an instance of Headers"
 *   Full redirect behaviour (status codes, Set-Cookie headers) belongs
 *   in Playwright e2e tests, not unit tests.
 *
 * WHAT IS TESTED HERE:
 *   1. isPublicPath — every PUBLIC_PATHS entry (exact + sub-path)
 *   2. isPublicPath — protected routes correctly return false
 *   3. isPublicPath — false-positive edge cases (prefix collisions)
 *   4. Routing decision logic — which destination for which status
 *
 * Strategy: mirror PUBLIC_PATHS and isPublicPath from middleware.ts
 * exactly. If middleware.ts changes, update here too.
 */

import { describe, it, expect } from 'vitest';

// ── Inline the logic under test ─────────────────────────────────────────────
// Mirrors PUBLIC_PATHS and isPublicPath from middleware.ts exactly.
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

// ── Routing decision logic (pure — no Next.js objects) ────────────────────
// Mirrors the routing decision inside middleware() without
// instantiating NextRequest/NextResponse.
function resolveDestination(
  pathname: string,
  isAuthenticated: boolean
): { action: 'pass' | 'redirect'; destination?: string } {
  if (isPublicPath(pathname)) {
    if (isAuthenticated && (pathname === '/signin' || pathname === '/signup')) {
      return { action: 'redirect', destination: '/score-boost-ap/dashboard' };
    }
    return { action: 'pass' };
  }
  if (!isAuthenticated) {
    return { action: 'redirect', destination: `/signin?next=${pathname}` };
  }
  return { action: 'pass' };
}

// ─────────────────────────────────────────────────────────────────
describe('isPublicPath', () => {

  describe('exact public path matches', () => {
    const exactPaths = [
      '/signin',
      '/signup',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];
    for (const p of exactPaths) {
      it(`returns true for exact match: ${p}`, () => {
        expect(isPublicPath(p)).toBe(true);
      });
    }
  });

  describe('sub-paths of public roots', () => {
    const subPaths = [
      '/auth/callback',
      '/legal/privacy-policy',
      '/legal/terms-of-service',
      '/_next/static/chunks/main.js',
      '/api/auth/signup',
      '/api/auth/signin',
      '/api/auth/signout',
      '/api/auth/callback',
      '/api/auth/reset-password',
    ];
    for (const p of subPaths) {
      it(`returns true for sub-path: ${p}`, () => {
        expect(isPublicPath(p)).toBe(true);
      });
    }
  });

  describe('protected routes return false', () => {
    const protectedPaths = [
      '/score-boost-ap/dashboard',
      '/score-boost-ap/practice',
      '/onboarding/subjects',
      '/onboarding/consent',
      '/onboarding/awaiting-consent',
      '/account/settings',
      '/api/users/me',
      '/api/stripe/webhook',
    ];
    for (const p of protectedPaths) {
      it(`returns false for protected route: ${p}`, () => {
        expect(isPublicPath(p)).toBe(false);
      });
    }
  });

  describe('false-positive edge cases — prefix collision guard', () => {
    it('/signinbad is NOT public (/signin exact only, no /signin/ prefix)', () => {
      expect(isPublicPath('/signinbad')).toBe(false);
    });
    it('/signup-success is NOT public (/signup exact only)', () => {
      expect(isPublicPath('/signup-success')).toBe(false);
    });
    it('/api/users is NOT public (/api/auth prefix, not /api/)', () => {
      expect(isPublicPath('/api/users')).toBe(false);
    });
    it('/authentication is NOT public (/auth prefix requires /auth/ not /auth...)', () => {
      expect(isPublicPath('/authentication')).toBe(false);
    });
    it('/signout is NOT public (not in PUBLIC_PATHS)', () => {
      expect(isPublicPath('/signout')).toBe(false);
    });
  });
});

describe('routing decisions', () => {

  describe('unauthenticated user on public path — pass through', () => {
    const publicPaths = ['/signin', '/signup', '/verify-email', '/auth/callback', '/api/auth/signup'];
    for (const p of publicPaths) {
      it(`passes through ${p} when not authenticated`, () => {
        expect(resolveDestination(p, false).action).toBe('pass');
      });
    }
  });

  describe('authenticated user on public path — pass through (except auth pages)', () => {
    it('passes through /verify-email when authenticated', () => {
      expect(resolveDestination('/verify-email', true).action).toBe('pass');
    });
    it('passes through /auth/callback when authenticated', () => {
      expect(resolveDestination('/auth/callback', true).action).toBe('pass');
    });
    it('passes through /legal/terms when authenticated', () => {
      expect(resolveDestination('/legal/terms', true).action).toBe('pass');
    });
  });

  describe('authenticated user on /signin or /signup — redirect to dashboard', () => {
    it('redirects /signin to /score-boost-ap/dashboard when authenticated', () => {
      const result = resolveDestination('/signin', true);
      expect(result.action).toBe('redirect');
      expect(result.destination).toBe('/score-boost-ap/dashboard');
    });
    it('redirects /signup to /score-boost-ap/dashboard when authenticated', () => {
      const result = resolveDestination('/signup', true);
      expect(result.action).toBe('redirect');
      expect(result.destination).toBe('/score-boost-ap/dashboard');
    });
  });

  describe('unauthenticated user on protected path — redirect to /signin?next=', () => {
    const protectedPaths = [
      '/score-boost-ap/dashboard',
      '/onboarding/subjects',
      '/onboarding/consent',
      '/onboarding/awaiting-consent',
      '/account/settings',
    ];
    for (const p of protectedPaths) {
      it(`redirects ${p} to /signin?next=${p} when not authenticated`, () => {
        const result = resolveDestination(p, false);
        expect(result.action).toBe('redirect');
        expect(result.destination).toBe(`/signin?next=${p}`);
      });
    }
  });

  describe('authenticated user on protected path — pass through', () => {
    it('passes through /score-boost-ap/dashboard when authenticated', () => {
      expect(resolveDestination('/score-boost-ap/dashboard', true).action).toBe('pass');
    });
    it('passes through /onboarding/subjects when authenticated', () => {
      expect(resolveDestination('/onboarding/subjects', true).action).toBe('pass');
    });
  });
});
