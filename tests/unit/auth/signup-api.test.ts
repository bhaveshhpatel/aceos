/**
 * UNIT TESTS — app/api/auth/signup/route.ts
 *
 * Gherkin source: tests/gherkin/sprint-1/functional/S1-F-01_email_signup.feature
 *
 * Strategy: mock @supabase/supabase-js createClient to intercept
 * auth.admin and from().insert() calls in isolation.
 *
 * Key implementation facts (read from route.ts):
 *   - Schema field: accept_terms (not tos_accepted/privacy_accepted)
 *   - from('students').insert() — first insert call
 *   - from('consent_log').insert([...]) — second insert call
 *   - auth.admin.generateLink() with type:'magiclink' — sends verification email
 *   - Rollback: auth.admin.deleteUser() if students insert fails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Granular mocks per table ──────────────────────────────────────────────────
const mockStudentsInsert = vi.fn().mockResolvedValue({ error: null });
const mockConsentInsert  = vi.fn().mockResolvedValue({ error: null });
const mockDeleteUser     = vi.fn().mockResolvedValue({});
const mockCreateUser     = vi.fn();
const mockGenerateLink   = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      insert: table === 'students' ? mockStudentsInsert : mockConsentInsert,
    })),
    auth: {
      admin: {
        createUser:   mockCreateUser,
        deleteUser:   mockDeleteUser,
        generateLink: mockGenerateLink,
      },
    },
  })),
}));

import { POST } from '@/app/api/auth/signup/route';

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/signup', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  }) as any;
}

const validBody = {
  first_name:   'Taylor',
  last_name:    'Swift',
  email:        'taylor@test.com',
  password:     'Secure123!',
  dob:          '2006-12-13',
  accept_terms: true,
  product:      'score-boost-ap',
};

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'taylor@test.com', user_metadata: {} } },
      error: null,
    });
    mockStudentsInsert.mockResolvedValue({ error: null });
    mockConsentInsert.mockResolvedValue({ error: null });
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  it('returns 201 with success:true on valid input', async () => {
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('calls generateLink with type:magiclink and product-scoped redirectTo', async () => {
    await POST(makeRequest(validBody));
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type:  'magiclink',
        email: 'taylor@test.com',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/onboarding/score-boost-ap/age-gate'),
        }),
      })
    );
  });

  it('sets account_status to pending_age_check for underage student', async () => {
    const today      = new Date();
    const underageDob = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
      .toISOString().split('T')[0];
    await POST(makeRequest({ ...validBody, dob: underageDob }));
    expect(mockStudentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ account_status: 'pending_age_check' })
    );
  });

  it('sets account_status to active for 18+ student', async () => {
    const today    = new Date();
    const adultDob = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate())
      .toISOString().split('T')[0];
    await POST(makeRequest({ ...validBody, dob: adultDob }));
    expect(mockStudentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ account_status: 'active' })
    );
  });

  it('inserts consent_log rows for ToS + Privacy Policy', async () => {
    await POST(makeRequest(validBody));
    expect(mockConsentInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ document_type: 'terms_of_service' }),
        expect.objectContaining({ document_type: 'privacy_policy' }),
      ])
    );
  });

  // ── Validation failures ───────────────────────────────────────────────────
  it('returns 400 with validation_failed on missing fields', async () => {
    const res  = await POST(makeRequest({ email: 'bad', password: '123' }));
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
      data:  { user: null },
      error: { message: 'User already registered', code: '23505' },
    });
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('duplicate_email');
  });

  // ── Rollback on students insert failure ─────────────────────────────────────
  it('deletes the auth user and returns 500 if students INSERT fails', async () => {
    mockStudentsInsert.mockResolvedValueOnce({ error: { message: 'insert failed' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('mock-user-id');
  });
});
