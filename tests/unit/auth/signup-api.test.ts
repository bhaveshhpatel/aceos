/**
 * UNIT TESTS — app/api/auth/signup/route.ts
 *
 * Gherkin source: tests/gherkin/sprint-1/functional/S1-F-01_email_signup.feature
 *
 * Strategy: mock @supabase/supabase-js and resend at module level so
 * neither constructor executes during test collection.
 *
 * Why vi.hoisted():
 *   Vitest hoists vi.mock() calls to the top of the file before any
 *   const/let declarations are evaluated. Any variable referenced inside
 *   a vi.mock() factory must therefore be declared with vi.hoisted(),
 *   which runs in the same hoisted scope. Without this the factory
 *   captures an uninitialised binding and throws a TDZ ReferenceError.
 *
 * Two-log architecture (T1.1 / T1.4):
 *   consent_log      — legal document acceptance only
 *                      columns: document_type, version, accepted_at, ip_address, user_agent
 *   auth_event_log   — auth lifecycle events only
 *                      columns: event_type, actor_email, ip_address, user_agent, metadata
 *
 * Error contract (T1.8 — SCREAMING_SNAKE_CASE):
 *   400 VALIDATION_ERROR      — Zod validation failed
 *   409 EMAIL_ALREADY_EXISTS  — duplicate email
 *   500 SIGNUP_FAILED         — students insert failed (rollback triggered)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist all mock fns BEFORE vi.mock() factories run ───────────────────────
const {
  mockResendSend,
  mockStudentsInsert,
  mockConsentInsert,
  mockAuthEventInsert,
  mockDeleteUser,
  mockCreateUser,
  mockGenerateLink,
} = vi.hoisted(() => ({
  mockResendSend:      vi.fn().mockResolvedValue({ error: null }),
  mockStudentsInsert:  vi.fn().mockResolvedValue({ error: null }),
  mockConsentInsert:   vi.fn().mockResolvedValue({ error: null }),
  mockAuthEventInsert: vi.fn().mockResolvedValue({ error: null }),
  mockDeleteUser:      vi.fn().mockResolvedValue({}),
  mockCreateUser:      vi.fn(),
  mockGenerateLink:    vi.fn(),
}));

// ── Mock resend ────────────────────────────────────────────────────────────
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

// ── Mock @supabase/supabase-js ──────────────────────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'students')       return { insert: mockStudentsInsert };
      if (table === 'consent_log')    return { insert: mockConsentInsert };
      if (table === 'auth_event_log') return { insert: mockAuthEventInsert };
      return { insert: vi.fn().mockRejectedValue(new Error(`Unexpected table: ${table}`)) };
    }),
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
  dob:          '2010-12-13',
  accept_terms: true,
};

function adultDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d.toISOString().split('T')[0];
}

function minorDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d.toISOString().split('T')[0];
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateUser.mockResolvedValue({
      data:  { user: { id: 'mock-user-id', email: 'taylor@test.com', user_metadata: {} } },
      error: null,
    });

    mockGenerateLink.mockResolvedValue({
      data:  { properties: { action_link: 'https://supabase.test/verify?token=abc' } },
      error: null,
    });

    mockStudentsInsert.mockResolvedValue({ error: null });
    mockConsentInsert.mockResolvedValue({ error: null });
    mockAuthEventInsert.mockResolvedValue({ error: null });
    mockResendSend.mockResolvedValue({ error: null });
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  it('returns 201 with success:true on valid input', async () => {
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── generateLink contract (S1-F-04) ────────────────────────────────────────
  it('calls generateLink with type:signup and redirectTo /auth/callback', async () => {
    await POST(makeRequest(validBody));
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type:  'signup',
        email: 'taylor@test.com',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    );
  });

  it('redirectTo URL contains no product slug or onboarding path', async () => {
    await POST(makeRequest(validBody));
    const callArgs = JSON.stringify(mockGenerateLink.mock.calls);
    expect(callArgs).not.toContain('score-boost-ap');
    expect(callArgs).not.toContain('age-gate');
    expect(callArgs).not.toContain('onboarding/');
  });

  it('passing a product field in body does NOT affect the redirectTo URL', async () => {
    await POST(makeRequest({ ...validBody, product: 'score-boost-ap' }));
    const callArgs = JSON.stringify(mockGenerateLink.mock.calls);
    expect(callArgs).not.toContain('score-boost-ap');
    expect(callArgs).not.toContain('age-gate');
  });

  // ── account_status ─────────────────────────────────────────────────────────
  it('sets account_status to pending_age_check for underage student', async () => {
    await POST(makeRequest({ ...validBody, dob: minorDob() }));
    expect(mockStudentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ account_status: 'pending_age_check' })
    );
  });

  it('sets account_status to active for 18+ student', async () => {
    await POST(makeRequest({ ...validBody, dob: adultDob() }));
    expect(mockStudentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ account_status: 'active' })
    );
  });

  // ── consent_log shape (T1.1 two-log schema) ────────────────────────────────
  it('writes ToS + Privacy Policy rows to consent_log with correct document_type and version', async () => {
    await POST(makeRequest(validBody));
    expect(mockConsentInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ document_type: 'terms_of_service', version: '1.0' }),
        expect.objectContaining({ document_type: 'privacy_policy',   version: '1.0' }),
      ])
    );
  });

  it('consent_log rows include accepted_at timestamp', async () => {
    await POST(makeRequest(validBody));
    const [insertArg] = mockConsentInsert.mock.calls[0];
    const rows = Array.isArray(insertArg) ? insertArg : [insertArg];
    rows.forEach((row: any) => {
      expect(row.accepted_at).toBeDefined();
      expect(typeof row.accepted_at).toBe('string');
    });
  });

  it('consent_log rows do NOT contain stale columns (event_type, document_version, actor_email)', async () => {
    await POST(makeRequest(validBody));
    const [insertArg] = mockConsentInsert.mock.calls[0];
    const rows = Array.isArray(insertArg) ? insertArg : [insertArg];
    rows.forEach((row: any) => {
      expect(row).not.toHaveProperty('event_type');
      expect(row).not.toHaveProperty('document_version');
      expect(row).not.toHaveProperty('actor_email');
    });
  });

  // ── auth_event_log shape (T1.1 two-log schema) ────────────────────────────
  it('writes age_verified_adult to auth_event_log for adult signup', async () => {
    await POST(makeRequest({ ...validBody, dob: adultDob() }));
    expect(mockAuthEventInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'age_verified_adult' })
    );
  });

  it('does NOT write to auth_event_log for minor signup', async () => {
    await POST(makeRequest({ ...validBody, dob: minorDob() }));
    expect(mockAuthEventInsert).not.toHaveBeenCalled();
  });

  it('does NOT write age_verified_adult to consent_log (wrong table)', async () => {
    await POST(makeRequest({ ...validBody, dob: adultDob() }));
    const allConsentCalls = mockConsentInsert.mock.calls.flat(2);
    const hasAdultEvent = allConsentCalls.some(
      (arg: any) => arg?.event_type === 'age_verified_adult' || arg?.document_type === 'age_verified_adult'
    );
    expect(hasAdultEvent).toBe(false);
  });

  // ── Validation failures ────────────────────────────────────────────────────
  it('returns 400 with VALIDATION_ERROR on missing fields', async () => {
    const res  = await POST(makeRequest({ email: 'bad', password: '123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  it('returns 400 on empty body', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when accept_terms is false', async () => {
    const res  = await POST(makeRequest({ ...validBody, accept_terms: false }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when password missing uppercase', async () => {
    const res = await POST(makeRequest({ ...validBody, password: 'secure123!' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password missing number', async () => {
    const res = await POST(makeRequest({ ...validBody, password: 'SecurePass!' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password shorter than 8 chars', async () => {
    const res = await POST(makeRequest({ ...validBody, password: 'S1!' }));
    expect(res.status).toBe(400);
  });

  // ── Duplicate email ────────────────────────────────────────────────────────
  it('returns 409 with EMAIL_ALREADY_EXISTS when Supabase returns duplicate email error', async () => {
    mockCreateUser.mockResolvedValueOnce({
      data:  { user: null },
      error: { message: 'User already registered', code: '23505' },
    });
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('EMAIL_ALREADY_EXISTS');
  });

  // ── Rollback scenarios ─────────────────────────────────────────────────────
  it('deletes auth user and returns 500 SIGNUP_FAILED if students INSERT fails', async () => {
    mockStudentsInsert.mockResolvedValueOnce({ error: { message: 'insert failed' } });
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('mock-user-id');
    const body = await res.json();
    expect(body.error).toBe('SIGNUP_FAILED');
  });

  it('deletes auth user and returns 500 SIGNUP_FAILED if generateLink fails', async () => {
    mockGenerateLink.mockResolvedValueOnce({ data: null, error: { message: 'link error' } });
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('mock-user-id');
    const body = await res.json();
    expect(body.error).toBe('SIGNUP_FAILED');
  });

  it('deletes auth user and returns 500 SIGNUP_FAILED if Resend email delivery fails', async () => {
    mockResendSend.mockResolvedValueOnce({ error: { message: 'send failed' } });
    const res  = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith('mock-user-id');
    const body = await res.json();
    expect(body.error).toBe('SIGNUP_FAILED');
  });

  it('does NOT call deleteUser on successful signup', async () => {
    await POST(makeRequest(validBody));
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
