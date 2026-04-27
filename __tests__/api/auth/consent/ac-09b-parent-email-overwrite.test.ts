/**
 * AC-09b — Parent email overwrite on correction (S1-F-03)
 *
 * Spec: When a student corrects their parent email by resubmitting
 * /onboarding/consent, students.parent_email must be overwritten with the
 * new value. The old email must not receive any further communications.
 *
 * Privacy note: Sending to the old address after correction is an unauthorized
 * disclosure of the student's enrollment to an unintended recipient.
 *
 * Tied to: T1.4 → [POST /api/auth/consent/send]
 * The consent/send route is called for both first-time submission AND correction.
 * The overwrite behavior is the same operation — an UPDATE on students row.
 */

import { POST } from '@/app/api/auth/consent/send/route'
import { NextRequest } from 'next/server'
import { vi, beforeEach } from 'vitest'

const mockSendConsentEmail = vi.fn().mockResolvedValue({ success: true })
let capturedUpdatePayload: Record<string, unknown> | null = null
let capturedEmailRecipient: string | null = null

const mockGetUser = vi.fn()
const mockStudentSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        capturedUpdatePayload = payload
        return { eq: () => ({ error: null }) }
      },
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: () => ({
        eq: () => ({ single: () => mockStudentSelect() }),
      }),
    }),
  }),
}))

vi.mock('@/lib/resend', () => ({
  sendConsentEmail: (args: { to: string }) => {
    capturedEmailRecipient = args.to
    return mockSendConsentEmail(args)
  },
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

describe('AC-09b — Parent email overwrite on correction', () => {
  beforeEach(() => {
    capturedUpdatePayload = null
    capturedEmailRecipient = null
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'minor-uid' } },
      error: null,
    })
    // Student already has an old parent email on record
    mockStudentSelect.mockResolvedValue({
      data: {
        id: 'minor-uid',
        first_name: 'Alex',
        email: 'alex@example.com',
        account_status: 'pending_consent',
        parent_email: 'parent@old.com', // previous submission
      },
      error: null,
    })
  })

  test('students.parent_email is updated to the new email', async () => {
    await POST(makeRequest('parent@new.com'))
    expect(capturedUpdatePayload).not.toBeNull()
    expect(capturedUpdatePayload!.parent_email).toBe('parent@new.com')
  })

  test('consent email is sent to the NEW parent email, not the old one', async () => {
    await POST(makeRequest('parent@new.com'))
    expect(capturedEmailRecipient).toBe('parent@new.com')
    expect(capturedEmailRecipient).not.toBe('parent@old.com')
  })

  test('old parent email is not present anywhere in the Resend call', async () => {
    await POST(makeRequest('parent@new.com'))
    const allSendArgs = JSON.stringify(mockSendConsentEmail.mock.calls)
    expect(allSendArgs).not.toContain('parent@old.com')
  })

  test('returns 200 on successful overwrite', async () => {
    const res = await POST(makeRequest('parent@new.com'))
    expect(res.status).toBe(200)
  })
})
