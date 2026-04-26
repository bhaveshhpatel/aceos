'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary:   'bg-brand-gradient text-white shadow-sm hover:opacity-90 active:opacity-80',
  secondary: 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50 active:bg-brand-100',
  ghost:     'bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
  outline:   'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50',
} as const;

const sizes = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-xl',
  xl: 'h-14 px-8 text-base rounded-xl',
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Primary button primitive. Use `variant` to control hierarchy.
 * Always renders a <button> — never use <div> as a button.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'min-h-[44px] min-w-[44px]',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
