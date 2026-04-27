/**
 * UNIT TESTS — middleware.ts
 * Tech debt payoff — Sprint 1
 *
 * Tests every branch in the Next.js middleware:
 *   1. Public paths — always pass through
 *   2. Auth page redirect — signed-in users redirected away from /signin, /signup
 *   3. Protected paths — unauthenticated users redirected to /signin?next=<path>
 *   4. Protected paths — authenticated users pass through
 *   5. isPublicPath helper — exact match, prefix match, no false positives
 *
 * Strategy:
 *   Mock @supabase/ssr createServerClient so getUser() returns
 *   controlled user/null values without a real network call.
 *   Construct real NextRequest objects so pathname/URL parsing is exercised.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock @supabase/ssr BEFORE importing middleware ────────────────────────────
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { middleware } from '@/middleware';

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeReq(pathname: string): NextRequest {
  return new NextRequest(`http://localhost${pathname}`);
}

function authed() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'test@test.com' } },
  });
}

function notAuthed() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe('middleware — route protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Public paths always pass through ────────────────────────────────────
  const publicPaths = [
    '/signin',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/legal/terms',
    '/api/auth/signup',
    '/api/auth/signin',
    '/api/auth/callback',
  ];

  publicPaths.forEach((path) => {
    it(`passes through ${path} without redirecting (unauthenticated)`, async () => {
      notAuthed();
      const res = await middleware(makeReq(path));
      expect(res.status).not.toBe(307);
      expect(res.status).not.toBe(302);
      const location = res.headers.get('location');
      expect(location).toBeNull();
    });
  });

  // ── Signed-in users redirected away from /signin and /signup ───────────
  it('redirects signed-in user away from /signin to /score-boost-ap/dashboard', async () => {
    authed();
    const res = await middleware(makeReq('/signin'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/score-boost-ap/dashboard');
  });

  it('redirects signed-in user away from /signup to /score-boost-ap/dashboard', async () => {
    authed();
    const res = await middleware(makeReq('/signup'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/score-boost-ap/dashboard');
  });

  it('does NOT redirect signed-in user on /verify-email (public, not auth-only redirect)', async () => {
    authed();
    const res = await middleware(makeReq('/verify-email'));
    expect(res.status).not.toBe(307);
  });

  // ── Unauthenticated users redirected to /signin on protected paths ────
  const protectedPaths = [
    '/score-boost-ap/dashboard',
    '/onboarding/subjects',
    '/onboarding/consent',
    '/onboarding/awaiting-consent',
    '/score-boost-ap/practice',
    '/account/settings',
  ];

  protectedPaths.forEach((path) => {
    it(`redirects unauthenticated user from ${path} to /signin`, async () => {
      notAuthed();
      const res = await middleware(makeReq(path));
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/signin');
    });
  });

  // ── next= param is preserved on redirect ──────────────────────────────
  it('includes next= param pointing to intended path on unauthenticated redirect', async () => {
    notAuthed();
    const res = await middleware(makeReq('/score-boost-ap/dashboard'));
    const location = res.headers.get('location') ?? '';
    const url = new URL(location);
    expect(url.pathname).toBe('/signin');
    expect(url.searchParams.get('next')).toBe('/score-boost-ap/dashboard');
  });

  it('preserves deeply nested path in next= param', async () => {
    notAuthed();
    const res = await middleware(makeReq('/onboarding/consent'));
    const location = res.headers.get('location') ?? '';
    const url = new URL(location);
    expect(url.searchParams.get('next')).toBe('/onboarding/consent');
  });

  // ── Authenticated users pass through protected paths ──────────────────
  it('allows authenticated user through /score-boost-ap/dashboard', async () => {
    authed();
    const res = await middleware(makeReq('/score-boost-ap/dashboard'));
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
  });

  it('allows authenticated user through /onboarding/subjects', async () => {
    authed();
    const res = await middleware(makeReq('/onboarding/subjects'));
    expect(res.status).not.toBe(307);
  });

  // ── isPublicPath edge cases ───────────────────────────────────────────
  it('/signinbad is NOT treated as public (prefix must be /signin/)', async () => {
    notAuthed();
    const res = await middleware(makeReq('/signinbad'));
    // Should be redirected, not pass through as public
    expect(res.status).toBe(307);
  });

  it('/api/auth/signup is public but /api/users is not', async () => {
    notAuthed();
    const res = await middleware(makeReq('/api/users'));
    expect(res.status).toBe(307);
  });

  it('/auth/callback is public', async () => {
    notAuthed();
    const res = await middleware(makeReq('/auth/callback'));
    expect(res.status).not.toBe(307);
  });

  it('/authentication is NOT treated as public (/auth prefix must end with /)', async () => {
    notAuthed();
    const res = await middleware(makeReq('/authentication'));
    expect(res.status).toBe(307);
  });
});
