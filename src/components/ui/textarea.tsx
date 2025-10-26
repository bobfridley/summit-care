import * as React from 'react';

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export default Textarea;
