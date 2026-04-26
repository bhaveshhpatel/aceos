'use client';

/**
 * SignInForm — S1-F-07
 * Email + password sign-in.
 * Submits to POST /api/auth/signin.
 * Routes to /dashboard or /onboarding/age-gate based on server response.
 *
 * useSearchParams() must live inside a component wrapped with <Suspense> to
 * satisfy Next.js 14 static generation. The outer SignInForm shell is the
 * Suspense boundary; SignInFormInner holds all search-param logic.
 */
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signInSchema, type SignInFormValues } from '@/types/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Alert } from '@/components/ui/Alert';
import { OAuthButton } from './OAuthButton';

function SignInFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get('error')
      ? 'Sign-in with Google failed. Please try again or use email instead.'
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
  });

  async function onSubmit(values: SignInFormValues) {
    setServerError(null);

    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'email_not_verified') {
        router.push('/verify-email');
        return;
      }
      setServerError(data.message ?? 'Something went wrong. Please try again.');
      return;
    }

    const next = searchParams.get('next') ?? data.redirectTo ?? '/dashboard';
    router.push(next);
  }

  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white text-xl font-bold shadow-raised">
          A
        </div>
        <h1 className="text-heading text-neutral-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in to continue your AP prep
        </p>
      </div>

      <OAuthButton />

      <Divider label="or" className="my-5" />

      {serverError && (
        <Alert message={serverError} type="error" className="mb-5" />
      )}

      {searchParams.get('expired') && !serverError && (
        <Alert
          type="info"
          message="Your session has expired. Please sign in again."
          className="mb-5"
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="form-field">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="form-label">
              Password <span className="text-danger-500 ml-0.5" aria-hidden="true">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`input-base${errors.password ? ' input-error' : ''}`}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="form-error">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          Create one for free
        </Link>
      </p>
    </motion.div>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={null}>
      <SignInFormInner />
    </Suspense>
  );
}
