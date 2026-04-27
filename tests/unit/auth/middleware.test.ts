/**
 * UNIT TESTS — middleware.ts
 *
 * Covers:
 *   1. Public paths pass through without session check
 *   2. Public API auth routes pass through (e.g. /api/auth/signup)
 *   3. Unauthenticated requests to protected routes redirect to /signin?next=<path>
 *   4. Authenticated users on /signin or /signup redirect to dashboard
 *   5. Authenticated users on protected routes pass through
 *   6. All PUBLIC_PATHS variants are correctly identified
 *
 * Strategy: mock @supabase/ssr createServerClient to control
 * auth.getUser() return value per test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock @supabase/ssr ────────────────────────────────────────────────────────
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { middleware } from '@/middleware';

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(path: string, method = 'GET') {
  return new NextRequest(`https://aceos-ai.vercel.app${path}`, { method });
}

function noSession() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

function withSession() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'test@example.com' } },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    noSession();
  });

  // ── Public page paths ────────────────────────────────────────────────────
  describe('public page paths — no session required', () => {
    const publicPaths = [
      '/signin',
      '/signup',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/auth/callback',
      '/legal/privacy-policy',
      '/legal/terms-of-service',
    ];

    for (const path of publicPaths) {
      it(`allows unauthenticated request through: ${path}`, async () => {
        noSession();
        const req = makeRequest(path);
        const res = await middleware(req);
        // Should NOT be a redirect to /signin
        expect(res.status).not.toBe(307);
        if (res.status === 307 || res.status === 302) {
          const location = res.headers.get('location') ?? '';
          expect(location).not.toContain('/signin');
        }
      });
    }
  });

  // ── Public API auth routes ───────────────────────────────────────────────
  describe('public API auth routes — no session required', () => {
    const publicApiPaths = [
      '/api/auth/signup',
      '/api/auth/signin',
      '/api/auth/callback',
    ];

    for (const path of publicApiPaths) {
      it(`allows unauthenticated POST through: ${path}`, async () => {
        noSession();
        const req = makeRequest(path, 'POST');
        const res = await middleware(req);
        expect(res.status).not.toBe(307);
        if (res.status === 307 || res.status === 302) {
          expect(res.headers.get('location')).not.toContain('/signin');
        }
      });
    }
  });

  // ── Protected routes — unauthenticated ───────────────────────────────────
  describe('protected routes — unauthenticated user redirected to /signin', () => {
    const protectedPaths = [
      '/score-boost-ap/dashboard',
      '/score-boost-ap/practice',
      '/onboarding/score-boost-ap/age-gate',
      '/settings',
    ];

    for (const path of protectedPaths) {
      it(`redirects unauthenticated request to /signin?next=${path}`, async () => {
        noSession();
        const req = makeRequest(path);
        const res = await middleware(req);
        expect([302, 307]).toContain(res.status);
        const location = res.headers.get('location') ?? '';
        expect(location).toContain('/signin');
        expect(location).toContain(encodeURIComponent(path));
      });
    }
  });

  // ── Authenticated user on auth pages ─────────────────────────────────────
  describe('authenticated user redirected away from auth pages', () => {
    it('redirects authenticated user from /signin to dashboard', async () => {
      withSession();
      const req = makeRequest('/signin');
      const res = await middleware(req);
      expect([302, 307]).toContain(res.status);
      const location = res.headers.get('location') ?? '';
      expect(location).toContain('/score-boost-ap/dashboard');
    });

    it('redirects authenticated user from /signup to dashboard', async () => {
      withSession();
      const req = makeRequest('/signup');
      const res = await middleware(req);
      expect([302, 307]).toContain(res.status);
      const location = res.headers.get('location') ?? '';
      expect(location).toContain('/score-boost-ap/dashboard');
    });
  });

  // ── Authenticated user on protected routes ───────────────────────────────
  describe('authenticated user on protected routes — passes through', () => {
    it('allows authenticated user through to /score-boost-ap/dashboard', async () => {
      withSession();
      const req = makeRequest('/score-boost-ap/dashboard');
      const res = await middleware(req);
      expect(res.status).not.toBe(302);
      expect(res.status).not.toBe(307);
    });

    it('allows authenticated user through to onboarding route', async () => {
      withSession();
      const req = makeRequest('/onboarding/score-boost-ap/age-gate');
      const res = await middleware(req);
      expect(res.status).not.toBe(302);
      expect(res.status).not.toBe(307);
    });
  });

  // ── next=<path> preservation ─────────────────────────────────────────────
  it('preserves the intended path in next= param on redirect', async () => {
    noSession();
    const req = makeRequest('/score-boost-ap/dashboard');
    const res = await middleware(req);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('next=%2Fscore-boost-ap%2Fdashboard');
  });
});
