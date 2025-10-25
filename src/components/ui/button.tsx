import * as React from 'react';

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

type Variant = 'default' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variantCls =
      variant === 'outline'
        ? 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
        : variant === 'ghost'
        ? 'text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-900/50'
        : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900';

    const sizeCls =
      size === 'icon'
        ? 'h-9 w-9 p-0 inline-flex items-center justify-center rounded-md'
        : size === 'sm'
        ? 'h-9 px-3 py-2 rounded-lg'
        : 'h-10 px-4 py-2 rounded-xl';

    return (
      <button
        ref={ref}
        className={cn('text-sm font-medium shadow-sm transition', variantCls, sizeCls, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
