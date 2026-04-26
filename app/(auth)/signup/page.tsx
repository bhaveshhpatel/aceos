import type { Metadata } from 'next';
import { SignUpForm } from '@/components/features/auth/SignUpForm';

export const metadata: Metadata = { title: 'Create Account' };

export default function SignUpPage() {
  return <SignUpForm />;
}
