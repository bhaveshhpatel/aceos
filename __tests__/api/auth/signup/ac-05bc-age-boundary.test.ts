/**
 * AC-05b + AC-05c — Age boundary conditions (S1-F-01)
 *
 * Spec: The 18-year age threshold is the COPPA/FERPA gate. The calculation
 * must be correct at the exact boundary:
 *   - Exactly 18 today            → adult  → account_status = 'active'
 *   - 17 years + 364 days today   → minor  → account_status = 'pending_age_check'
 *
 * Tied to: T1.4 → [POST /api/auth/signup] → "compute age from dob"
 *
 * NOTE: Tests use vi.setSystemTime() to pin "today" so boundary math is
 * deterministic. Always restore real timers after each test.
 */

import { POST } from '@/app/api/auth/signup/route'
import { NextRequest } from 'next/server'
import { vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(dob: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: `boundary-${dob}@example.com`,
      password: 'ValidPass1',
      dob,
      acceptedTerms: true,
    }),
  })
}

/**
 * Returns a DOB string such that the student is exactly `years` years old
 * on `today`.
 */
function dobExactlyYearsAgo(years: number, today: Date): string {
  const d = new Date(today)
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().split('T')[0]
}

/**
 * Returns a DOB string such that the student is `years` years old MINUS
 * one day on `today` — i.e. their birthday is tomorrow.
 */
function dobOneShortOf(years: number, today: Date): string {
  const d = new Date(today)
  d.setFullYear(d.getFullYear() - years)
  d.setDate(d.getDate() + 1) // birthday is tomorrow
  return d.toISOString().split('T')[0]
}

// Pin system time for all tests in this file
const PINNED_TODAY = new Date('2026-04-26T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(PINNED_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Mock Supabase so we can inspect the students row that would be inserted
// ---------------------------------------------------------------------------

let capturedStudentInsert: Record<string, unknown> | null = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        // Simulate successful user creation — return a fake uid
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'fake-uid-boundary-test' } },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        if (table === 'students') capturedStudentInsert = row
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
// AC-05b — Exactly 18 today → adult
// ---------------------------------------------------------------------------

describe('AC-05b — Student who is exactly 18 today is treated as adult', () => {
  beforeEach(() => { capturedStudentInsert = null })

  test('account_status is set to active when dob makes student exactly 18 today', async () => {
    const dob = dobExactlyYearsAgo(18, PINNED_TODAY)
    const req = makeRequest(dob)
    await POST(req)

    expect(capturedStudentInsert).not.toBeNull()
    expect(capturedStudentInsert!.account_status).toBe('active')
  })

  test('adult signup does NOT produce a pending_age_check status at the boundary', async () => {
    const dob = dobExactlyYearsAgo(18, PINNED_TODAY)
    const req = makeRequest(dob)
    await POST(req)

    expect(capturedStudentInsert!.account_status).not.toBe('pending_age_check')
  })
})

// ---------------------------------------------------------------------------
// AC-05c — 17 years 364 days old today → minor
// ---------------------------------------------------------------------------

describe('AC-05c — Student who is 17y 364d today is treated as minor', () => {
  beforeEach(() => { capturedStudentInsert = null })

  test('account_status is set to pending_age_check when birthday is tomorrow', async () => {
    const dob = dobOneShortOf(18, PINNED_TODAY)
    const req = makeRequest(dob)
    await POST(req)

    expect(capturedStudentInsert).not.toBeNull()
    expect(capturedStudentInsert!.account_status).toBe('pending_age_check')
  })

  test('minor signup does NOT produce an active status one day before birthday', async () => {
    const dob = dobOneShortOf(18, PINNED_TODAY)
    const req = makeRequest(dob)
    await POST(req)

    expect(capturedStudentInsert!.account_status).not.toBe('active')
  })
})

// ---------------------------------------------------------------------------
// Sanity — clearly adult (20 years) → active
// Sanity — clearly minor (15 years) → pending_age_check
// ---------------------------------------------------------------------------

describe('Age gate sanity checks', () => {
  beforeEach(() => { capturedStudentInsert = null })

  test('20-year-old → active', async () => {
    const dob = dobExactlyYearsAgo(20, PINNED_TODAY)
    await POST(makeRequest(dob))
    expect(capturedStudentInsert!.account_status).toBe('active')
  })

  test('15-year-old → pending_age_check', async () => {
    const dob = dobExactlyYearsAgo(15, PINNED_TODAY)
    await POST(makeRequest(dob))
    expect(capturedStudentInsert!.account_status).toBe('pending_age_check')
  })
})
