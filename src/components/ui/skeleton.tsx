// @ts-nocheck
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      {...props}
    />
  );
}

export default Skeleton; // supports default imports too
