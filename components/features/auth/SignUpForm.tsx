'use client';

/**
 * SignUpForm — S1-F-01
 * Email + password registration form.
 *
 * Validates with Zod via React Hook Form.
 * Submits to POST /api/auth/signup.
 * On success: redirects to /verify-email.
 *
 * Acceptance criteria covered:
 *   AC-01 Valid registration succeeds
 *   AC-02 Duplicate email rejected (inline error)
 *   AC-03 Weak password rejected (field-level)
 *   AC-04 Missing field blocks submission
 *   AC-05 Invalid DOB rejected
 *   AC-08 ToS acceptance required
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signUpSchema, type SignUpFormValues } from '@/types/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Alert } from '@/components/ui/Alert';
import { OAuthButton } from './OAuthButton';

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  });

  async function onSubmit(values: SignUpFormValues) {
    setServerError(null);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'duplicate_email') {
        setError('email', { message: data.message });
        return;
      }
      if (data.error === 'validation_failed') {
        Object.entries(data.issues ?? {}).forEach(([field, messages]) => {
          setError(field as keyof SignUpFormValues, {
            message: (messages as string[])[0],
          });
        });
        return;
      }
      setServerError(data.message ?? 'Something went wrong. Please try again.');
      return;
    }

    router.push('/verify-email');
  }

  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white text-xl font-bold shadow-raised">
          A
        </div>
        <h1 className="text-heading text-neutral-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Start your AP exam prep journey today
        </p>
      </div>

      {/* Google OAuth */}
      <OAuthButton />

      <Divider label="or" className="my-5" />

      {/* Server-level error */}
      {serverError && (
        <Alert message={serverError} type="error" className="mb-5" />
      )}

      {/* Sign-up form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            required
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            required
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, one uppercase letter, one number"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Date of birth"
          type="date"
          required
          error={errors.dob?.message}
          {...register('dob')}
        />

        {/* ToS checkbox — S1-F-08 */}
        <div className="flex items-start gap-3">
          <input
            id="accept_terms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 cursor-pointer"
            aria-describedby={errors.accept_terms ? 'terms-error' : undefined}
            aria-invalid={!!errors.accept_terms}
            {...register('accept_terms')}
          />
          <div className="flex flex-col gap-0.5">
            <label htmlFor="accept_terms" className="text-sm text-neutral-700 cursor-pointer leading-snug">
              I agree to the{' '}
              <Link
                href="/legal/privacy-policy"
                target="_blank"
                className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="/legal/terms-of-service"
                target="_blank"
                className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                Terms of Service
              </Link>
            </label>
            {errors.accept_terms && (
              <p id="terms-error" role="alert" className="form-error">
                {errors.accept_terms.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          className="mt-2"
        >
          Create Account
        </Button>
      </form>

      {/* Sign-in link */}
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link
          href="/signin"
          className="font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
