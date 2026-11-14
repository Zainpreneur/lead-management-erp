'use client';
import * as React from 'react';
import { ChevronDown, X, Search, Loader2, Plus, Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface ComboboxOption<T = unknown> {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  avatar?: string;
  meta?: T;
  isRecent?: boolean;
}

interface ComboboxProps<T = unknown> {
  options: ComboboxOption<T>[];
  value: string;
  onChange: (value: string, option?: ComboboxOption<T>) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  showRecent?: boolean;
  recentKey?: string;
  maxRecent?: number;
  maxResults?: number;
  allowCreate?: boolean;
  createLabel?: string;
  onCreate?: (label: string) => Promise<string> | string;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: ComboboxOption['badgeVariant'] }) {
  const base = 'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium';
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    secondary: 'bg-slate-100 text-slate-600',
    destructive: 'bg-rose-100 text-rose-700',
    outline: 'border border-slate-300 bg-transparent',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
  };
  return <span className={cn(base, variants[variant])}>{children}</span>;
}

export function Combobox<T = unknown>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  searchable = true,
  showRecent = true,
  recentKey,
  maxRecent = 5,
  maxResults = 10,
  allowCreate = false,
  createLabel = 'Create new',
  onCreate,
  className = '',
  label,
  error,
  required = false,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [recentValues, setRecentValues] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load recent from localStorage
  React.useEffect(() => {
    if (recentKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`combobox-recent-${recentKey}`);
        if (stored) setRecentValues(JSON.parse(stored));
      } catch { }
    }
  }, [recentKey]);

  // Save recent
  const addRecent = (val: string) => {
    if (!recentKey) return;
    setRecentValues(prev => {
      const next = [val, ...prev.filter(v => v !== val)].slice(0, maxRecent);
      try { localStorage.setItem(`combobox-recent-${recentKey}`, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  // Filter options
  const filteredOptions = React.useMemo(() => {
    let opts = options;
    if (query) {
      const q = query.toLowerCase();
      opts = opts.filter(o =>
        o.label.toLowerCase().includes(q) ||
        o.subtitle?.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        o.avatar?.toLowerCase().includes(q)
      );
    }
    return opts.slice(0, maxResults);
  }, [options, query, maxResults]);

  // Get recent options
  const recentOptions = React.useMemo(() => {
    if (!showRecent || !recentValues.length || query) return [];
    return recentValues
      .map(v => options.find(o => o.value === v))
      .filter((o): o is ComboboxOption<T> => !!o)
      .map(o => ({ ...o, isRecent: true }));
  }, [showRecent, recentValues, query, options]);

  // Combined display options
  const displayOptions = [...recentOptions, ...filteredOptions.filter(o => !recentOptions.some(r => r.value === o.value))];

  // Handle selection
  const selectOption = (opt: ComboboxOption<T>) => {
    onChange(opt.value, opt);
    addRecent(opt.value);
    setOpen(false);
    setQuery('');
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); setQuery(''); setFocusedIndex(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, displayOptions.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, -1)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && displayOptions[focusedIndex]) selectOption(displayOptions[focusedIndex]);
        else if (allowCreate && query.trim() && onCreate) {
          const newVal = onCreate(query.trim());
          Promise.resolve(newVal).then(v => {
            const opt = options.find(o => o.value === v) || { value: v, label: query.trim() };
            selectOption(opt as ComboboxOption<T>);
          });
        }
      }
      else if (e.key === 'Tab') { setOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, displayOptions, focusedIndex, query, allowCreate, onCreate, options]);

  // Focus management
  React.useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 0); setFocusedIndex(-1); }
  }, [open]);

  // Click outside to close
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) && inputRef.current !== e.target) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn('w-full', className)}>
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label} {required && <span className="text-rose-500">*</span>}</label>}
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={selectedOption?.label || (value ? '' : '')}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onClick={() => { setOpen(true); setQuery(''); }}
            onFocus={() => setOpen(true)}
            disabled={disabled}
            className={cn('pr-10', error && 'border-rose-300 focus:ring-rose-200 focus:border-rose-300')}
            readOnly={!searchable}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? 'combobox-list' : undefined}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {query && (
              <button onClick={() => { setQuery(''); setFocusedIndex(-1); }} className="text-slate-400 hover:text-slate-600" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
          </div>
        </div>

        {open && (
          <div
            ref={listRef}
            id="combobox-list"
            className="absolute z-50 mt-1 w-full max-h-96 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100"
            role="listbox"
          >
            {recentOptions.length && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 uppercase border-b border-slate-100">
                  <Clock className="h-3 w-3" /> Recent
                </div>
                {recentOptions.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={focusedIndex === i}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setFocusedIndex(i)}
                    className={cn('w-full px-3 py-2 text-left flex items-center gap-2', focusedIndex === i ? 'bg-brand-50' : 'hover:bg-slate-50')}
                  >
                    {opt.avatar && <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center">{opt.avatar}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-slate-900">{opt.label}</div>
                      {opt.subtitle && <div className="text-xs text-slate-500 truncate">{opt.subtitle}</div>}
                    </div>
                    {opt.badge && <Badge variant={opt.badgeVariant}>{opt.badge}</Badge>}
                    {opt.isRecent && <span className="text-xs text-slate-400">Recent</span>}
                  </button>
                ))}
                <div className="border-t border-slate-100" />
              </>
            )}

            {filteredOptions.length === 0 && !query && !recentOptions.length && (
              <div className="px-3 py-4 text-center text-sm text-slate-400">No options available</div>
            )}

            {filteredOptions.length === 0 && query && (
              <div className="px-3 py-2 text-center text-sm text-slate-400">No matches for "{query}"</div>
            )}

            {filteredOptions.map((opt, i) => {
              const idx = recentOptions.length + i;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={focusedIndex === idx}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={cn('w-full px-3 py-2 text-left flex items-center gap-2', focusedIndex === idx ? 'bg-brand-50' : 'hover:bg-slate-50')}
                >
                  {opt.avatar && <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center">{opt.avatar}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-slate-900">{opt.label}</div>
                    {opt.subtitle && <div className="text-xs text-slate-500 truncate">{opt.subtitle}</div>}
                  </div>
                  {opt.badge && <Badge variant={opt.badgeVariant}>{opt.badge}</Badge>}
                </button>
              );
            })}

            {allowCreate && query.trim() && (
              <button
                type="button"
                role="option"
                onClick={() => {
                  Promise.resolve(onCreate?.(query.trim())).then(v => {
                    const opt = options.find(o => o.value === v) || { value: v, label: query.trim() };
                    selectOption(opt as ComboboxOption<T>);
                  });
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-brand-600 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                <span>{createLabel} "{query.trim()}"</span>
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
