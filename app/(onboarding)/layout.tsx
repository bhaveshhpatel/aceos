/**
 * Onboarding route group layout.
 * Shared across all product onboarding flows:
 *   /onboarding/score-boost-ap/age-gate
 *   /onboarding/score-boost-ap/subjects
 *   /onboarding/grade-guard/...
 *
 * Centered single-column layout, progress indicator slot.
 * No nav bar — user hasn't completed onboarding yet.
 */
import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-start pt-12 pb-16 px-4">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
