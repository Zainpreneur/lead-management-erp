'use client';

export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { calculateAssetDepreciation, calculateAllAssetDepreciation, listAssets } from '@/actions/assets';
import type { Asset } from '@/lib/types';
import { ASSET_STATUS_LABELS, ASSET_MAINTENANCE_TYPE_LABELS } from '@/lib/types';

export default function AssetDepreciationPage() {
  const [assets, setAssets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [calculating, setCalculating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAssets({ limit: 1000, page: 1 });
      setAssets(result.assets);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleCalculateAll = async () => {
    setCalculating(true);
    try {
      const result = await calculateAllAssetDepreciation();
      toast.success(`Depreciation calculated: ${result.processed} assets processed, $${result.totalDepreciation.toLocaleString()} total`);
      await load();
    } catch (e) {
      toast.error('Depreciation calculation failed', { description: e instanceof Error ? e.message : '' });
    } finally { setCalculating(false); }
  };

  const handleCalculateSingle = async (reference: string) => {
    try {
      const result = await calculateAssetDepreciation(reference);
      toast.success(`Depreciation: $${result.monthlyDepreciation.toLocaleString()} applied`);
      await load();
    } catch (e) {
      toast.error('Calculation failed', { description: e instanceof Error ? e.message : '' });
    }
  };

  React.useEffect(() => { load(); }, [load]);

  const depreciableAssets = assets.filter((a) => a.depreciationRate > 0 && a.status !== 'disposed' && a.status !== 'lost');

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Asset Depreciation</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{depreciableAssets.length} depreciable</span>
          </div>
          <Button size="sm" onClick={handleCalculateAll} disabled={calculating || depreciableAssets.length === 0}>
            {calculating ? 'Calculating...' : 'Calculate All Depreciation'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {depreciableAssets.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
                No depreciable assets found. Assets must have depreciation rate &gt; 0 and not be disposed/lost.
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Purchase Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Depreciation Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Accumulated</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Book Value</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Monthly Depreciation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {depreciableAssets.map((asset) => {
                      const monthlyDepreciation = (asset.purchasePrice * (asset.depreciationRate / 100)) / 12;
                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm font-mono text-slate-900">{asset.reference}</td>
                          <td className="px-4 py-3 text-sm text-slate-900">{asset.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-0.5 rounded text-xs font-medium border text-slate-600 bg-slate-100 border-slate-200">
                              {ASSET_STATUS_LABELS[asset.status] ?? asset.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">${asset.purchasePrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">${asset.depreciationRate}%</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">${(asset.accumulatedDepreciation || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">${(asset.bookValue || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-emerald-600">${monthlyDepreciation.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="secondary" size="sm" onClick={() => handleCalculateSingle(asset.reference)}>
                              Calculate
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}