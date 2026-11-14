'use client';

export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getProjectProfitability } from '@/actions/reports';
import type { Project } from '@/lib/types';
import { PROJECT_STATUS_LABELS } from '@/lib/types';

export default function ProjectProfitabilityPage() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProjectProfitability();
      setProjects(result.projects);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((s, p) => s + (p.actualCost || 0), 0);
  const totalActualRevenue = projects.reduce((s, p) => s + (p.actualRevenue || 0), 0);
  const totalProfit = projects.reduce((s, p) => s + (p.profit || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Project Profitability</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase text-slate-500">Total Budget</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">${totalBudget.toLocaleString()}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase text-slate-500">Actual Cost</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">${totalActualCost.toLocaleString()}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase text-slate-500">Actual Revenue</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">${totalActualRevenue.toLocaleString()}</div>
            </div>
            <div className={`rounded-md border border-slate-200 bg-white p-4 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <div className="text-xs font-medium uppercase text-slate-500">Total Profit</div>
              <div className="mt-1 text-2xl font-bold">${totalProfit.toLocaleString()}</div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Project Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Budget</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Actual Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Actual Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Margin %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Budget %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projects.map((p) => {
                  const profitColor = (p.profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600';
                  const marginColor = (p.profitMargin || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">{p.reference}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 rounded text-xs font-medium border text-slate-600 bg-slate-100 border-slate-200">
                          {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">${(p.budget || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">${(p.actualCost || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">${(p.actualRevenue || 0).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-sm text-right font-mono ${profitColor}`}>${(p.profit || 0).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-sm text-right font-mono ${marginColor}`}>${(p.profitMargin || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">${(p.budgetUtilization || 0).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase">Total Budget</div>
                <div className="text-lg font-bold text-slate-900">${totalBudget.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">Total Actual Cost</div>
                <div className="text-lg font-bold text-slate-900">${totalActualCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">Total Actual Revenue</div>
                <div className="text-lg font-bold text-slate-900">${totalActualRevenue.toLocaleString()}</div>
              </div>
              <div>
                <div className={`text-xs font-medium uppercase text-slate-500 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Total Profit</div>
                <div className={`mt-1 text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${totalProfit.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}