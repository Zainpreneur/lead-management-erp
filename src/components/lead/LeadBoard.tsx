'use client';
import { LeadCard } from './LeadCard';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import type { Lead } from '@/lib/types';
import { STAGE_LABELS } from '@/lib/types';

const COLUMNS = ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'];

export function LeadBoard({ leads, onMove }: { leads: Lead[]; onMove: (lead: Lead, stage: string) => void }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {COLUMNS.map((stage) => {
          const colLeads = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="w-72 shrink-0 rounded-md border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">{STAGE_LABELS[stage]}</span>
                  <Badge tone={stage}>{colLeads.length}</Badge>
                </div>
              </div>
              <div className="space-y-2 p-2">
                {colLeads.map((lead) => (
                  <div key={lead.id} className="space-y-1">
                    <LeadCard lead={lead} />
                    <Select
                      value={lead.stage}
                      onChange={(e) => onMove(lead, e.target.value)}
                      className="h-8 text-xs"
                    >
                      {Object.entries(STAGE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </Select>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">No leads</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}