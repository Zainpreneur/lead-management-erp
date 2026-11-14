'use client';

import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Failed to load leads</h1>
        <p className="mb-6 text-slate-600">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
          <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}