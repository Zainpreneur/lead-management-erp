'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { AuditLog } from '@/lib/types';

export default function AuditPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [entityType, setEntityType] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listAuditLogs({ entityType: entityType || undefined, limit: 200 });
      setLogs(res.logs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [entityType]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Audit Log</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{logs.length}</span>
          </div>
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-40">
            <option value="">All entities</option>
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
            <option value="proposal">Proposal</option>
            <option value="task">Task</option>
            <option value="product">Product</option>
            <option value="contact">Contact</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">{l.entityType} • {l.entityReference} • {l.action}</div>
                  <div className="text-xs text-slate-500">{l.actor} • {new Date(l.createdAt).toLocaleString()}</div>
                </div>
              </div>
              {l.details && <div className="mt-1 text-xs text-slate-600">{l.details}</div>}
            </div>
          ))}
          {logs.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No audit logs.</div>}
        </div>
      )}
    </div>
  );
}