/**
 * AC-03b — Server-side parent email validation (S1-F-03)
 *
 * Spec: POST /api/auth/consent/send must reject malformed parent emails
 * at the API layer, independent of client-side form validation.
 * A direct API call with a bad email must not trigger a Resend call
 * or write to students.parent_email.
 *
 * Tied to: T1.4 → [POST /api/auth/consent/send] → "validate parent_email (Zod)"
 */

import { POST } from '@/app/api/auth/consent/send/route'
import { NextRequest } from 'next/server'
import { vi, beforeEach } from 'vitest'

const mockSendConsentEmail = vi.fn()
const mockUpdate = vi.fn().mockResolvedValue({ error: null })
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
      update: () => ({ eq: () => mockUpdate() }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: () => ({
        eq: () => ({ single: () => mockStudentSelect() }),
      }),
    }),
  }),
}))

vi.mock('@/lib/resend', () => ({
  sendConsentEmail: mockSendConsentEmail,
}))

function makeRequest(parentEmail: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/consent/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_email: parentEmail }),
  })
}

describe('AC-03b — Server-side parent email validation', () => {
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

  test('rejects malformed email — returns 400 VALIDATION_ERROR', async () => {
    const res = await POST(makeRequest('notanemail'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.fields.parent_email).toBeDefined()
  })

  test('rejects empty string — returns 400', async () => {
    const res = await POST(makeRequest(''))
    expect(res.status).toBe(400)
  })

  test('rejects missing field — returns 400', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/auth/consent/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(400)
  })

  test('sendConsentEmail is NOT called when parent email is invalid', async () => {
    await POST(makeRequest('bad@@email'))
    expect(mockSendConsentEmail).not.toHaveBeenCalled()
  })

  test('students.parent_email is NOT written when parent email is invalid', async () => {
    await POST(makeRequest('notanemail'))
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('valid email passes validation and proceeds', async () => {
    const res = await POST(makeRequest('parent@valid.com'))
    expect(res.status).not.toBe(400)
  })
})
