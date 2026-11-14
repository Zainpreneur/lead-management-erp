'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 transition-colors duration-150 focus:outline-none focus:ring-2 min-h-[40px]',
      error
        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
        : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';