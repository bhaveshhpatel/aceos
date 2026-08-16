'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { maskEmail } from '@/lib/utils';

export default function AwaitingConsentPage() {
  const [parentEmail, setParentEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.parent_email) {
            setParentEmail(data.parent_email);
          }
          if (data.account_status === 'active') {
            router.push('/onboarding/subjects');
          }
        }
      } catch (err) {
        console.error('Failed to fetch status', err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();

    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (!parentEmail || resendCooldown > 0) return;
    setResending(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/consent/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_email: parentEmail }),
      });

      if (res.ok) {
        setMessage('Approval request resent to parent.');
        setResendCooldown(60);
      } else {
        const data = await res.json();
        setMessage(data.message || 'Failed to resend approval request.');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md text-center dark:bg-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Waiting for Approval
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          We sent an approval request to{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {parentEmail ? maskEmail(parentEmail) : 'your parent'}
          </span>
          .
        </p>

        {message && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {message}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {resending
              ? 'Resending...'
              : resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : 'Resend Approval Request'}
          </button>

          <div>
            <Link
              href="/onboarding/consent"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Wrong email? Change parent email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
