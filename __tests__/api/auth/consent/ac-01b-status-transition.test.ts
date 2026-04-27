/**
 * AC-01b — pending_age_check → pending_consent status transition (S1-F-03)
 *
 * Spec: When a minor submits a valid parent email to POST /api/auth/consent/send,
 * students.account_status must transition from pending_age_check to pending_consent
 * AND students.parent_email must be written in the same operation.
 *
 * If either write is missing, the student is stuck: middleware routes them back
 * to /onboarding/consent on every signin attempt indefinitely.
 *
 * Tied to: T1.4 → [POST /api/auth/consent/send]
 */

import { POST } from '@/app/api/auth/consent/send/route'
import { NextRequest } from 'next/server'
import { vi, beforeEach } from 'vitest'

const mockUpdate = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockGetUser = vi.fn()

const mockStudentSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      update: () => ({ eq: () => mockUpdate() }),
      insert: mockInsert,
      select: () => ({
        eq: () => ({
          single: () => mockStudentSelect(),
        }),
      }),
    }),
  }),
}))

vi.mock('@/lib/resend', () => ({
  sendConsentEmail: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockReturnValue({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock.jwt.token'),
  }),
}))

function makeRequest(parentEmail: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/consent/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_email: parentEmail }),
  })
}

describe('AC-01b — consent/send status transition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'minor-uid' } },
      error: null,
    })
    mockStudentSelect.mockResolvedValue({
      data: {
        id: 'minor-uid',
        first_name: 'Alex',
        email: 'alex@example.com',
        account_status: 'pending_age_check',
        parent_email: null,
      },
      error: null,
    })
  })

  test('account_status is updated to pending_consent', async () => {
    await POST(makeRequest('parent@example.com'))
    expect(mockUpdate).toHaveBeenCalled()
    // The update call must include account_status: 'pending_consent'
    const updateArgs = mockUpdate.mock.calls[0]
    expect(JSON.stringify(updateArgs)).toContain('pending_consent')
  })

  test('parent_email is written to students row', async () => {
    await POST(makeRequest('parent@example.com'))
    const updateArgs = mockUpdate.mock.calls[0]
    expect(JSON.stringify(updateArgs)).toContain('parent@example.com')
  })

  test('both status transition and parent_email write happen in same request', async () => {
    await POST(makeRequest('parent@example.com'))
    // Only one update call — both fields must be in the same .update() payload
    // Two separate update calls would be a race condition risk
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  test('returns 200 on success', async () => {
    const res = await POST(makeRequest('parent@example.com'))
    expect(res.status).toBe(200)
  })

  test('rejects request with no active session (401)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await POST(makeRequest('parent@example.com'))
    expect(res.status).toBe(401)
  })
})
