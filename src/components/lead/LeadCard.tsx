'use client';
import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal, Eye, Edit3, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/layout/Money';
import type { Lead } from '@/lib/types';
import { STAGE_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '@/lib/types';

export function LeadCard({
  lead,
  onEdit,
  onDelete,
  onView,
  onConvert,
}: {
  lead: Lead;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onConvert?: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const location = [lead.city, lead.country].filter(Boolean).join(', ');

  return (
    <Card className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/leads/${lead.reference}`} className="block truncate text-base font-semibold text-slate-900 hover:text-brand-600">
            {lead.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {lead.reference}{location ? ` • ${location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={lead.priority}>{PRIORITY_LABELS[lead.priority] ?? lead.priority}</Badge>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Actions"
              className="flex h-11 w-11 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => { setMenuOpen(false); onView?.(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" /> View Details
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onEdit?.(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-4 w-4" /> Edit Lead
                </button>
                {onConvert && (
                  <button
                    onClick={() => { setMenuOpen(false); onConvert(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserPlus className="h-4 w-4" /> Convert to Customer
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); onDelete?.(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete Lead
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone={lead.stage}>{STAGE_LABELS[lead.stage] ?? lead.stage}</Badge>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700">
          Score {lead.score}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="text-base font-bold text-slate-900">
          <Money value={lead.estimatedValue} />
        </div>
        {lead.assignedToName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{lead.assignedToName}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
              {lead.assignedToName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}