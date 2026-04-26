'use client';

/**
 * VerifyEmailScreen — S1-F-04
 * Shown after email sign-up while user awaits verification.
 *
 * Acceptance criteria:
 *   AC-02 Expired link — resend CTA
 *   AC-03 Unverified user cannot access features (enforced by middleware)
 *   AC-04 Resend works correctly
 */
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

type ResendState = 'idle' | 'loading' | 'sent' | 'error';

export function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const isExpired = searchParams.get('expired') === 'true';
  const [resendState, setResendState] = useState<ResendState>('idle');

  async function handleResend() {
    if (!email || resendState === 'loading') return;
    setResendState('loading');

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/age-gate`,
      },
    });

    setResendState(error ? 'error' : 'sent');
  }

  return (
    <motion.div
      className="auth-card text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Icon */}
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Mail className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="text-heading text-neutral-900">Check your email</h1>

      <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
        {email ? (
          <>
            We sent a verification link to{' '}
            <span className="font-medium text-neutral-700">{email}</span>.
            <br />
            Click the link to activate your account.
          </>
        ) : (
          'We sent a verification link to your email address. Click the link to activate your account.'
        )}
      </p>

      {/* Expired link message — AC-02 */}
      {isExpired && (
        <Alert
          type="error"
          message="This link has expired. Click below to resend a new verification email."
          className="mt-5 text-left"
        />
      )}

      {/* Resend feedback */}
      {resendState === 'sent' && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-success-500 font-medium">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          New verification email sent!
        </div>
      )}

      {resendState === 'error' && (
        <Alert
          type="error"
          message="Failed to resend. Please try again in a moment."
          className="mt-5 text-left"
        />
      )}

      {/* Resend CTA */}
      {resendState !== 'sent' && email && (
        <Button
          variant="secondary"
          size="md"
          onClick={handleResend}
          loading={resendState === 'loading'}
          className="mt-6"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Resend verification email
        </Button>
      )}

      <p className="mt-6 text-xs text-neutral-400">
        Can&apos;t find the email? Check your spam folder.
      </p>
    </motion.div>
  );
}
