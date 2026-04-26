import type { Metadata } from 'next';
import { VerifyEmailScreen } from '@/components/features/auth/VerifyEmailScreen';

export const metadata: Metadata = { title: 'Check Your Email' };

export default function VerifyEmailPage() {
  return <VerifyEmailScreen />;
}
