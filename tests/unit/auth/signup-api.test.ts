/**
 * UNIT TESTS — app/api/auth/signup/route.ts
 *
 * Gherkin source: tests/gherkin/sprint-1/functional/S1-F-01_email_signup.feature
 *
 * Strategy: mock Supabase service client + signUpSchema to test
 * the route handler's orchestration logic in isolation.
 * We do NOT hit the real database in unit tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockInsert        = vi.fn().mockResolvedValue({ error: null });
const mockDeleteUser    = vi.fn().mockResolvedValue({});
const mockCreateUser    = vi.fn();
const mockGenerateLink  = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({ insert: mockInsert }),
    auth: {
      admin: {
        createUser:    mockCreateUser,
        deleteUser:    mockDeleteUser,
        generateLink:  mockGenerateLink,
      },
    },
  })),
}));

// ── Import after mocks are set up ─────────────────────────────────────────────
import { POST } from '@/app/api/auth/signup/route';

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/signup', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  }) as any;
}

const validBody = {
  first_name:       'Taylor',
  last_name:        'Swift',
  email:            'taylor@test.com',
  password:         'Secure123!',
  dob:              '2006-12-13',
  tos_accepted:     true,
  privacy_accepted: true,
  product:          'score-boost-ap',
};

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'taylor@test.com', user_metadata: {} } },
      error: null,
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  it('returns 201 with success:true on valid input', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('calls generateLink with the correct product-scoped redirectTo URL', async () => {
    await POST(makeRequest(validBody));
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type:  'signup',
        email: 'taylor@test.com',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/onboarding/score-boost-ap/age-gate'),
        }),
      })
    );
  });

  it('sets account_status to pending_age_check for underage student (DOB = 15 yrs ago)', async () => {
    const today = new Date();
    const underageDob = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
      .toISOString().split('T')[0];
    await POST(makeRequest({ ...validBody, dob: underageDob }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ account_status: 'pending_age_check' })
    );
  });

  it('sets account_status to active for 18+ student', async () => {
    const today = new Date();
    const adultDob = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate())
      .toISOString().split('T')[0];
    await POST(makeRequest({ ...validBody, dob: adultDob }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ account_status: 'active' })
    );
  });

  it('inserts two consent_log rows (ToS + Privacy Policy)', async () => {
    await POST(makeRequest(validBody));
    // insert is called twice: once for students row, once for consent_log batch
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  // ── Validation failures ───────────────────────────────────────────────────
  it('returns 400 with validation_failed on missing fields', async () => {
    const res = await POST(makeRequest({ email: 'bad', password: '123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('validation_failed');
  });

  it('returns 400 on empty body', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  // ── Duplicate email ────────────────────────────────────────────────────────
  it('returns 409 when Supabase returns a duplicate email error', async () => {
    mockCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User already registered', code: '23505' },
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('duplicate_email');
  });

  // ── Rollback on student insert failure ─────────────────────────────────────
  it('deletes the auth user and returns 500 if students INSERT fails', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'insert failed' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('mock-user-id');
  });
});
