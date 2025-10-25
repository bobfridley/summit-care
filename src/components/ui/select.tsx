import * as React from 'react';

export interface SelectRootProps<TValue extends string = string> {
  value: TValue;
  onValueChange: (v: TValue) => void;
  children: React.ReactNode;
}

export function Select<TValue extends string = string>({
  value,
  onValueChange,
  children,
}: SelectRootProps<TValue>) {
  // Just a context to pass handlers down to Trigger/Content/Item
  const ctx = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
  return <SelectCtx.Provider value={ctx}>{children}</SelectCtx.Provider>;
}

type Ctx<TValue extends string = string> = {
  value: TValue;
  onValueChange: (v: TValue) => void;
};
const SelectCtx = React.createContext<Ctx<any> | null>(null);

export interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm ${className ?? ''}`}
      {...props}
    />
  );
}

export interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}
export function SelectValue({ placeholder, children }: SelectValueProps) {
  return <span>{children ?? placeholder ?? 'Select'}</span>;
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export function SelectContent({ className, ...props }: SelectContentProps) {
  return (
    <div
      className={`mt-2 w-full rounded-lg border bg-white p-1 shadow-lg dark:bg-stone-900 ${className ?? ''}`}
      {...props}
    />
  );
}

export interface SelectItemProps<TValue extends string = string>
  extends React.HTMLAttributes<HTMLDivElement> {
  value: TValue;
}
export function SelectItem<TValue extends string = string>({
  value,
  className,
  children,
  ...props
}: SelectItemProps<TValue>) {
  const ctx = React.useContext(SelectCtx);
  return (
    <div
      role="option"
      data-value={value}
      onClick={() => ctx?.onValueChange(value)}
      className={`cursor-pointer rounded-md px-2 py-1 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 ${className ?? ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
