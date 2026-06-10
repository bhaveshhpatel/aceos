/**
 * /onboarding/[product]/age-gate
 * S1-F-03 — Age Gate & Parental Consent
 *
 * Route accessed after email verification. Students enter their DOB.
 * - 18+: Verified as adult, redirect to subject selection
 * - <18: Request parent consent, show waiting screen
 */
import type { Metadata } from 'next';
import { AgeGateForm } from '@/components/features/auth/AgeGateForm';

export const metadata: Metadata = {
  title: 'Verify Your Age — AceOS',
};

export default function AgeGatePage() {
  return <AgeGateForm />;
}
