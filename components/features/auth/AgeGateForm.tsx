'use client';

/**
 * AgeGateForm — S1-F-03
 * 
 * Collects date of birth and routes user appropriately:
 * - 18+: Mark as verified adult, redirect to subject selection
 * - <18: Request parent email, create consent request, show waiting screen
 */

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

type FormStep = 'dob' | 'parent-email' | 'waiting';
type FormError = { field: string; message: string } | null;

export function AgeGateForm() {
  const router = useRouter();
  const params = useParams();
  const product = params.product as string || 'ap-calculus-ab';

  const [step, setStep] = useState<FormStep>('dob');
  const [dob, setDob] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [error, setError] = useState<FormError>(null);
  const [loading, setLoading] = useState(false);

  const calculateAge = (dateString: string): number | null => {
    try {
      const [month, day, year] = dateString.split('/').map(Number);
      if (!month || !day || !year) return null;

      const birthDate = new Date(year, month - 1, day);
      const today = new Date();

      if (birthDate > today) {
        return null;
      }

      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      return calculatedAge;
    } catch {
      return null;
    }
  };

  const handleDobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate DOB format
    const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dobRegex.test(dob)) {
      setError({ field: 'dob', message: 'Please use MM/DD/YYYY format' });
      return;
    }

    const calculatedAge = calculateAge(dob);

    if (!calculatedAge) {
      setError({ field: 'dob', message: 'Please enter a valid birth date' });
      return;
    }

    if (calculatedAge < 13) {
      setError({ field: 'dob', message: 'You must be at least 13 years old to use AceOS' });
      return;
    }

    setAge(calculatedAge);

    if (calculatedAge >= 18) {
      // Adult — r`/onboarding/${product}/subjects`
      setLoading(true);
      router.push('/onboarding/ap-calculus-ab/subjects');
    } else {
      // Minor — request parent email
      setStep('parent-email');
    }
  };

  const handleParentEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError({ field: 'parentEmail', message: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/parental-consent-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_email: parentEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({
          field: 'parentEmail',
          message: data.message || 'Failed to create consent request',
        });
        setLoading(false);
        return;
      }

      // Success — show waiting screen
      setStep('waiting');
    } catch (err) {
      setError({
        field: 'parentEmail',
        message: 'Something went wrong. Please try again.',
      });
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/parental-consent-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_email: parentEmail }),
      });

      if (res.ok) {
        setError({ field: 'success', message: 'Consent email resent!' });
        setTimeout(() => setError(null), 3000);
      } else {
        setError({
          field: 'parentEmail',
          message: 'Failed to resend. Please try again.',
        });
      }
    } catch (err) {
      setError({
        field: 'parentEmail',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'waiting') {
    return (
      <motion.div
        className="auth-card text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
          <Calendar className="h-8 w-8" />
        </div>

        <h1 className="text-heading text-neutral-900">Waiting for parent approval</h1>

        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
          We sent a consent request to <span className="font-medium text-neutral-700">{parentEmail}</span>.
          <br />
          Your parent can approve your account in the email they receive.
        </p>

        <p className="mt-4 text-xs text-neutral-500">
          This request expires in 30 days. You can resend it anytime.
        </p>

        <Button
          variant="secondary"
          size="md"
          onClick={handleResendEmail}
          disabled={loading}
          className="mt-6"
        >
          {loading ? 'Resending...' : 'Resend consent email'}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {step === 'dob' ? (
        <form onSubmit={handleDobSubmit} className="space-y-5">
          <div>
            <h1 className="text-heading text-neutral-900">What's your birth date?</h1>
            <p className="mt-2 text-sm text-neutral-500">
              We need to verify your age to provide the appropriate experience.
            </p>
          </div>

          {error && error.field === 'dob' && (
            <Alert type="error" message={error.message} />
          )}

          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-neutral-700 mb-2">
              Date of Birth
            </label>
            <Input
              id="dob"
              type="text"
              placeholder="MM/DD/YYYY"
              value={dob}
              onChange={(e) => setDob(e.target.value.slice(0, 10))}
              disabled={loading}
              className="text-center"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Example: 01/15/2006
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !dob}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleParentEmailSubmit} className="space-y-5">
          <div>
            <h1 className="text-heading text-neutral-900">
              Parent permission required
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Since you're under 18, we need your parent's permission to proceed.
              We'll send them an email to approve your account.
            </p>
          </div>

          {error && error.field === 'parentEmail' && (
            <Alert type="error" message={error.message} />
          )}

          <div>
            <label htmlFor="parentEmail" className="block text-sm font-medium text-neutral-700 mb-2">
              Parent's Email
            </label>
            <Input
              id="parentEmail"
              type="email"
              placeholder="parent@example.com"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep('dob');
                setDob('');
                setAge(null);
                setError(null);
              }}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading || !parentEmail}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send consent email'}
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
