import type { Metadata } from 'next';
import { SignInForm } from '@/components/features/auth/SignInForm';

export const metadata: Metadata = { title: 'Sign In' };

export default function SignInPage() {
  return <SignInForm />;
}
