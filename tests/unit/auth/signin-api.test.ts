/**
 * UNIT TESTS — app/api/auth/signin/route.ts
 *
 * Gherkin source: tests/gherkin/sprint-1/functional/S1-F-01_email_signup.feature
 *                 tests/gherkin/sprint-1/functional/S1-F-07_session_persistence.feature
 *
 * Strategy: mock Supabase server client to test route handler orchestration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase SSR server client mock ──────────────────────────────────────────
const mockSignIn    = vi.fn();
const mockGetUser   = vi.fn();
const mockSelect    = vi.fn();
const mockEq        = vi.fn();
const mockSingle    = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignIn,
      getUser:            mockGetUser,
    },
    from: vi.fn().mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle,
        }),
      }),
    }),
  })),
}));

import { POST } from '@/app/api/auth/signin/route';

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/signin', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  }) as any;
}

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  it('returns 200 when credentials are valid and account is active', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: { id: 'uid-1', email: 'taylor@test.com', email_confirmed_at: new Date().toISOString() } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: 'uid-1', account_status: 'active', onboarding_completed: true },
      error: null,
    });
    const res = await POST(makeRequest({ email: 'taylor@test.com', password: 'Secure123!' }));
    expect(res.status).toBe(200);
  });

  // ── Invalid credentials ────────────────────────────────────────────────────
  it('returns 401 when credentials are wrong', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    const res = await POST(makeRequest({ email: 'wrong@test.com', password: 'WrongPass1!' }));
    expect(res.status).toBe(401);
  });

  // ── Email not verified ─────────────────────────────────────────────────────
  it('returns 403 with email_not_verified when user has not verified email', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: { id: 'uid-2', email: 'unverified@test.com', email_confirmed_at: null } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { id: 'uid-2', account_status: 'active', onboarding_completed: false },
      error: null,
    });
    const res = await POST(makeRequest({ email: 'unverified@test.com', password: 'Secure123!' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('email_not_verified');
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  it('returns 400 on missing email', async () => {
    const res = await POST(makeRequest({ password: 'Secure123!' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on empty body', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});
