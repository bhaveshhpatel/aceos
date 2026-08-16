'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleResend() {
    setMessage('Verification link resent to your email.');
    setCooldown(60);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md text-center dark:bg-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Check Your Inbox
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          We sent a verification link to your email address. Please click the link in the email to verify your account.
        </p>

        {message && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {message}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>

          <div>
            <Link
              href="/signin"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
