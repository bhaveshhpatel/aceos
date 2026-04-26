import { cn } from '@/lib/utils';

interface DividerProps {
  label?: string;
  className?: string;
}

/**
 * Horizontal divider, optionally with a centered label (e.g. "or").
 */
export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn('border-neutral-200', className)} />;
  }
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 border-t border-neutral-200" />
      <span className="text-sm text-neutral-400 font-medium">{label}</span>
      <div className="flex-1 border-t border-neutral-200" />
    </div>
  );
}
