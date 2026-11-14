'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { GoodsReceipt } from '@/lib/types';

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = React.useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGoodsReceipts({ limit: pageSize, page });
      setReceipts(res.receipts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Goods Receipts</span>
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{receipts.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {receipts.map((r) => (
              <div key={r.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{r.reference}</div>
                    <div className="text-xs text-slate-500">{r.poReference} • {r.receivedDate} • {r.receivedBy || '—'}</div>
                  </div>
                  <div className="text-xs text-slate-500">{r.items.reduce((s, i) => s + i.quantityReceived, 0)} units</div>
                </div>
                {r.items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {r.items.map((it) => (
                      <div key={it.id} className="text-xs text-slate-600">• {it.description}: {it.quantityReceived} received</div>
                    ))}
                  </div>
                )}
                {r.notes && <p className="mt-2 text-sm text-slate-600">{r.notes}</p>}
              </div>
            ))}
            {receipts.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No goods receipts yet.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={receipts.length < pageSize}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}
