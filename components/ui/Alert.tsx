'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const alertStyles = {
  error:   { wrapper: 'bg-danger-50 border-danger-200 text-danger-800',   icon: AlertCircle,    iconClass: 'text-danger-500' },
  success: { wrapper: 'bg-success-50 border-success-200 text-success-800', icon: CheckCircle2,   iconClass: 'text-success-500' },
  info:    { wrapper: 'bg-brand-50 border-brand-200 text-brand-800',        icon: Info,           iconClass: 'text-brand-500' },
} as const;

export interface AlertProps {
  type?: keyof typeof alertStyles;
  message: string;
  className?: string;
}

/**
 * Inline alert for form-level feedback.
 * Uses role="alert" so screen readers announce it immediately.
 */
export function Alert({ type = 'error', message, className }: AlertProps) {
  const { wrapper, icon: Icon, iconClass } = alertStyles[type];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        wrapper,
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
