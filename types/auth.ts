/**
 * Auth domain types for AceOS.
 * All form schemas validated with Zod at runtime.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Password rule — reused across sign-up and reset
// ─────────────────────────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ─────────────────────────────────────────────────────────────
// Sign-up form schema — S1-F-01
// ─────────────────────────────────────────────────────────────
export const signUpSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name:  z.string().min(1, 'Last name is required').max(50),
  email:      z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password:   passwordSchema,
  dob:        z.string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(now.getFullYear() - 100);
      return d <= now && d >= hundredYearsAgo;
    }, 'Please enter a valid date of birth'),
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Privacy Policy and Terms of Service to continue' }),
  }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// ─────────────────────────────────────────────────────────────
// Sign-in form schema
// ─────────────────────────────────────────────────────────────
export const signInSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

// ─────────────────────────────────────────────────────────────
// Account status enum — mirrors DB constraint
// ─────────────────────────────────────────────────────────────
export type AccountStatus =
  | 'pending_age_check'
  | 'pending_consent'
  | 'active'
  | 'declined'
  | 'suspended';

// ─────────────────────────────────────────────────────────────
// Student profile type — subset returned to client
// ─────────────────────────────────────────────────────────────
export interface StudentProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  dob: string;
  account_status: AccountStatus;
  email_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
}
