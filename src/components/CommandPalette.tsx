'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

const typeIcons: Record<string, string> = {
  lead: '📋',
  customer: '👤',
  invoice: '📄',
  product: '📦',
  task: '✅',
  expense: '💰',
  proposal: '📝',
  request: '🔧',
  ticket: '🎫',
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut
    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Search
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setResults(res.results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all modules..."
            className="flex-1 border-none bg-transparent text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <div className="py-4 text-center text-sm text-slate-500">Searching...</div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="py-4 text-center text-sm text-slate-500">No results found.</div>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setOpen(false);
                    router.push(r.url as string);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="text-lg">{typeIcons[r.type as string] || '🔍'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{r.title as string}</div>
                    <div className="truncate text-xs text-slate-500">{r.reference as string} • {r.subtitle as string}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!loading && query.length < 2 && (
            <div className="py-4 text-center text-xs text-slate-400">Type at least 2 characters to search.</div>
          )}
        </div>
        <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-400">
          Press <kbd className="rounded bg-slate-100 px-1 py-0.5">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}