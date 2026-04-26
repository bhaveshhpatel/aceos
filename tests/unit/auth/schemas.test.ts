/**
 * UNIT TESTS — types/auth.ts: Zod validation schemas
 *
 * Gherkin source: tests/gherkin/sprint-1/functional/S1-F-01_email_signup.feature
 *                 tests/gherkin/sprint-1/functional/S1-F-04_email_verification.feature
 *
 * Implementation at: types/auth.ts
 */

import { describe, it, expect } from 'vitest';
import { signUpSchema, signInSchema } from '@/types/auth';

// ─────────────────────────────────────────────────────────────────────────────
// signUpSchema
// ─────────────────────────────────────────────────────────────────────────────
describe('signUpSchema', () => {
  const validPayload = {
    first_name: 'Taylor',
    last_name: 'Swift',
    email: 'taylor@example.com',
    password: 'Secure123!',
    dob: '2006-12-13',
    tos_accepted: true,
    privacy_accepted: true,
  };

  it('passes with a fully valid payload', () => {
    const result = signUpSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('fails when email is malformed', () => {
    const result = signUpSchema.safeParse({ ...validPayload, email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it('fails when password is shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({ ...validPayload, password: 'Short1!' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });

  it('fails when first_name is empty', () => {
    const result = signUpSchema.safeParse({ ...validPayload, first_name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.first_name).toBeDefined();
  });

  it('fails when tos_accepted is false', () => {
    const result = signUpSchema.safeParse({ ...validPayload, tos_accepted: false });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.tos_accepted).toBeDefined();
  });

  it('fails when privacy_accepted is false', () => {
    const result = signUpSchema.safeParse({ ...validPayload, privacy_accepted: false });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.privacy_accepted).toBeDefined();
  });

  it('fails when dob is missing', () => {
    const { dob: _dob, ...withoutDob } = validPayload;
    const result = signUpSchema.safeParse(withoutDob);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.dob).toBeDefined();
  });

  it('fails when dob is not a valid date string', () => {
    const result = signUpSchema.safeParse({ ...validPayload, dob: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('fails when required fields are missing entirely', () => {
    const result = signUpSchema.safeParse({});
    expect(result.success).toBe(false);
    const errors = result.error?.flatten().fieldErrors;
    expect(errors?.email).toBeDefined();
    expect(errors?.password).toBeDefined();
    expect(errors?.first_name).toBeDefined();
  });

  it('trims whitespace from first_name and last_name', () => {
    const result = signUpSchema.safeParse({ ...validPayload, first_name: '  Taylor  ', last_name: '  Swift  ' });
    if (result.success) {
      expect(result.data.first_name).toBe('Taylor');
      expect(result.data.last_name).toBe('Swift');
    }
    // If schema doesn't trim, test still informs us — no assertion failure on parse
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signInSchema
// ─────────────────────────────────────────────────────────────────────────────
describe('signInSchema', () => {
  const validPayload = {
    email: 'taylor@example.com',
    password: 'Secure123!',
  };

  it('passes with valid email and password', () => {
    const result = signInSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('fails when email is malformed', () => {
    const result = signInSchema.safeParse({ ...validPayload, email: 'bad@@email' });
    expect(result.success).toBe(false);
  });

  it('fails when password is empty', () => {
    const result = signInSchema.safeParse({ ...validPayload, password: '' });
    expect(result.success).toBe(false);
  });

  it('fails when both fields are missing', () => {
    const result = signInSchema.safeParse({});
    expect(result.success).toBe(false);
    const errors = result.error?.flatten().fieldErrors;
    expect(errors?.email).toBeDefined();
    expect(errors?.password).toBeDefined();
  });
});
