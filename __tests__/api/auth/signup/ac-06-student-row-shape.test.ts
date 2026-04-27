/**
 * AC-06 — Student row shape after successful signup (S1-F-01)
 *
 * Spec: Every column on the students row that drives downstream routing
 * must be asserted at signup time. Prior version of AC-06 missed:
 *   - account_status
 *   - onboarding_completed
 *   - parent_email
 *
 * Tied to: T1.1 students schema + T1.4 signup state machine
 */

import { POST } from '@/app/api/auth/signup/route'
import { NextRequest } from 'next/server'
import { vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Capture the students row insert so we can assert its shape
// ---------------------------------------------------------------------------

let capturedInsert: Record<string, unknown> | null = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-uid-ac06' } },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        if (table === 'students') capturedInsert = { ...row }
        // consent_log inserts are also captured but we don't assert them here
        return { error: null }
      },
      select: () => ({ single: () => ({ data: null, error: null }) }),
    }),
  }),
}))

vi.mock('@/lib/resend', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdultSignupRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Maria',
      lastName: 'Chen',
      email: 'maria.chen@example.com',
      password: 'ValidPass1',
      dob: '2000-01-15', // adult
      acceptedTerms: true,
    }),
  })
}

function makeMinorSignupRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Alex',
      lastName: 'Kim',
      email: 'alex.kim@example.com',
      password: 'ValidPass1',
      dob: new Date(Date.now() - 15 * 365.25 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      acceptedTerms: true,
    }),
  })
}

// ---------------------------------------------------------------------------
// AC-06 — Adult signup row shape
// ---------------------------------------------------------------------------

describe('AC-06 — Adult student row shape after signup', () => {
  beforeEach(() => { capturedInsert = null })

  test('id matches the auth uid returned by createUser', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.id).toBe('test-uid-ac06')
  })

  test('email is stored correctly', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.email).toBe('maria.chen@example.com')
  })

  test('first_name and last_name are stored', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.first_name).toBe('Maria')
    expect(capturedInsert!.last_name).toBe('Chen')
  })

  test('dob is stored', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.dob).toBe('2000-01-15')
  })

  test('account_status is active for adult', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.account_status).toBe('active')
  })

  test('email_verified is false at signup', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.email_verified).toBe(false)
  })

  test('onboarding_completed is false at signup', async () => {
    await POST(makeAdultSignupRequest())
    expect(capturedInsert!.onboarding_completed).toBe(false)
  })

  test('parent_email is null for adult account', async () => {
    await POST(makeAdultSignupRequest())
    // parent_email must be explicitly null — not undefined, not missing key
    expect(capturedInsert!.parent_email).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AC-06 — Minor signup row shape
// ---------------------------------------------------------------------------

describe('AC-06 — Minor student row shape after signup', () => {
  beforeEach(() => { capturedInsert = null })

  test('account_status is pending_age_check for minor', async () => {
    await POST(makeMinorSignupRequest())
    expect(capturedInsert!.account_status).toBe('pending_age_check')
  })

  test('email_verified is false at signup for minor', async () => {
    await POST(makeMinorSignupRequest())
    expect(capturedInsert!.email_verified).toBe(false)
  })

  test('onboarding_completed is false at signup for minor', async () => {
    await POST(makeMinorSignupRequest())
    expect(capturedInsert!.onboarding_completed).toBe(false)
  })

  test('parent_email is null at signup time — set later by consent/send', async () => {
    await POST(makeMinorSignupRequest())
    // parent_email is NOT set at signup — it's written by POST /api/auth/consent/send
    expect(capturedInsert!.parent_email).toBeNull()
  })
})
