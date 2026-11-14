'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, helperText, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2',
        error
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
          : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20',
        'min-h-[40px]',
        className
      )}
      {...props}
    />
    {helperText && (
      <p className={cn('mt-1 text-xs', error ? 'text-rose-600' : 'text-slate-500')}>{helperText}</p>
    )}
  </div>
));
Input.displayName = 'Input';