import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900',
        secondary:
          'border-transparent bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100',
        outline: 'text-stone-900',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  /** optional onClick so you can use it like a pill-button */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export default Badge;
