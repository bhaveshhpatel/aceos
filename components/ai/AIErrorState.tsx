'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { USER_FACING_ERRORS, AIErrorCode } from '@/lib/ai/errors';

interface AIErrorStateProps {
  errorCode: AIErrorCode | string;
  message?: string;
  retryable?: boolean;
  onRetry?: () => void;
  savedConfirmed?: boolean;
}

export function AIErrorState({
  errorCode,
  message,
  retryable = true,
  onRetry,
  savedConfirmed = true,
}: AIErrorStateProps) {
  const displayMessage =
    message ||
    USER_FACING_ERRORS[errorCode as AIErrorCode] ||
    'Something went wrong with our AI service. Please try again.';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/30"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{displayMessage}</p>
          {savedConfirmed && (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              ✓ Your answer has been saved
            </p>
          )}
          {retryable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-1.5 rounded-md bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:hover:bg-yellow-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
