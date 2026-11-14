'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { SyncQueueItem, SyncStats } from '@/lib/types';

export default function OfflinePage() {
  const toast = useToast();
  const [stats, setStats] = React.useState<SyncStats | null>(null);
  const [syncs, setSyncs] = React.useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, q] = await Promise.all([api.getSyncStats(), api.listPendingSyncs()]);
      setStats(s.stats);
      setSyncs(q.syncs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleProcess = async (id: number) => {
    try {
      await api.markSyncProcessed(id);
      toast.add({ variant: 'success', title: 'Sync processed' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not process', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleFail = async (id: number) => {
    try {
      await api.markSyncFailed(id);
      toast.add({ variant: 'warning', title: 'Sync marked as failed' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not mark failed', description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Offline Sync</span>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase text-slate-500">Pending</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase text-slate-500">Failed</div>
            <div className="mt-1 text-2xl font-bold text-rose-600">{stats.failed}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase text-slate-500">Processed</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.processed}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase text-slate-500">Snapshots</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{stats.snapshots}</div>
          </div>
        </div>
      ) : null}

      {/* Pending Syncs */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Sync Queue</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="space-y-3">
            {syncs.map((s) => (
              <div key={s.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{s.entityType} • {s.entityReference}</div>
                    <div className="text-xs text-slate-500">{s.action} • {s.status} • retries: {s.retryCount}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleProcess(s.id)} className="text-xs text-emerald-600 hover:underline">Process</button>
                    <button onClick={() => handleFail(s.id)} className="text-xs text-rose-600 hover:underline">Fail</button>
                  </div>
                </div>
              </div>
            ))}
            {syncs.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No pending syncs.</div>}
          </div>
        )}
      </div>
    </div>
  );
}