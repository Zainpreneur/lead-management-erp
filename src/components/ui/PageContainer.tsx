import * as React from 'react';
import { cn } from '@/lib/cn';

export function PageContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6', className)}>
      {children}
    </div>
  );
}

export function Section({ 
  title, 
  description, 
  children, 
  className 
}: { 
  title?: string; 
  description?: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <section className={cn('mb-6', className)}>
      {title && (
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function CardGrid({ 
  children, 
  cols = 3 
}: { 
  children: React.ReactNode; 
  cols?: 1 | 2 | 3 | 4;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={cn('grid gap-3', gridCols[cols])}>
      {children}
    </div>
  );
}