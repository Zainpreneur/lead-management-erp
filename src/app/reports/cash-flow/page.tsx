'use client';

export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getCashFlowForecast } from '@/actions/reports';

export default function CashFlowPage() {
  const [forecast, setForecast] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCashFlowForecast({ months: 12 });
      setForecast(result.forecast);
      setSummary(result.summary);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const totalInflows = summary?.totalInflows || 0;
  const totalOutflows = summary?.totalOutflows || 0;
  const netCashFlow = summary?.netCashFlow || 0;
  const finalBalance = forecast[forecast.length - 1]?.runningBalance || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Cash Flow Forecast</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase text-slate-500">Total Inflows</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">+${totalInflows.toLocaleString()}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase text-slate-500">Total Outflows</div>
              <div className="mt-1 text-2xl font-bold text-rose-600">-${totalOutflows.toLocaleString()}</div>
            </div>
            <div className={`rounded-md border border-slate-200 bg-white p-4 ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <div className="text-xs font-medium uppercase text-slate-500">Net Cash Flow</div>
              <div className="mt-1 text-2xl font-bold">${netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}</div>
            </div>
            <div className={`rounded-md border border-slate-200 bg-white p-4 ${finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <div className="text-xs font-medium uppercase text-slate-500">Projected End Balance</div>
              <div className="mt-1 text-2xl font-bold">${finalBalance >= 0 ? '+' : ''}${finalBalance.toLocaleString()}</div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Inflows</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Outflows</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Net Flow</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {forecast.map((m, idx) => {
                  const netColor = m.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600';
                  const balanceColor = m.runningBalance >= 0 ? 'text-emerald-600' : 'text-rose-600';
                  return (
                    <tr key={m.month} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">{m.month}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-emerald-600">+${m.inflows.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-rose-600">-${m.outflows.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-sm text-right font-mono ${netColor}`}>${m.netFlow >= 0 ? '+' : ''}${m.netFlow.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-sm text-right font-mono ${balanceColor}`}>${m.runningBalance >= 0 ? '+' : ''}${m.runningBalance.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 1.333a1 1 0 011.9 0l.983 2.95a1 1 0 001.691 1.15l2.027.684a1 1 0 01.573 1.814l-1.485 1.855a1 1 0 00-.33.942l.062 1.957a1 1 0 01-1.694.99l-1.834-.615a1 1 0 00-1.66.33l-.553 1.656a1 1 0 01-1.182.589l-1.869-.372a1 1 0 01-.888-.888l-.372-1.869a1 1 0 01.589-1.182l1.656-.553a1 1 0 00.33-1.66l-.615-1.834a1 1 0 01.99-1.694l1.957.062a1 1 0 00.942-.33l1.855-1.485a1 1 0 011.814-.573l.684-2.027a1 1 0 00-1.15-1.691L9.05 1.333z"></path></svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900">About Cash Flow Forecasting</h3>
                <p className="text-sm text-slate-600">
                  Cash flow forecast projects monthly inflows (invoices due/paid) and outflows (expenses) 
                  based on current data. Use this to plan for cash shortages and surplus periods.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}