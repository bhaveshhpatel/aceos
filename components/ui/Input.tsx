'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Form input with integrated label, error, and hint.
 * Always wire with React Hook Form via {...register('fieldName')}.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId  = hint  ? `${inputId}-hint`  : undefined;

    return (
      <div className="form-field">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && (
              <span className="text-danger-500 ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'input-base',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-sm text-neutral-500">{hint}</p>
        )}
        {error && (
          <p id={errorId} role="alert" className="form-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
