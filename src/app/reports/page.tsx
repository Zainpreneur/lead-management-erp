'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [reportType, setReportType] = React.useState('profit_loss');
  const [startDate, setStartDate] = React.useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getReport(reportType, startDate, endDate);
      setReport(res.report);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [reportType, startDate, endDate]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { loadReport(); }, [loadReport]);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Financial Reports</span>
        </div>
      </div>

      {/* Report Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Report Type</label>
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-48">
            <option value="profit_loss">Profit & Loss</option>
            <option value="cash_flow">Cash Flow</option>
            <option value="aging">Aging Report</option>
            <option value="revenue_by_customer">Revenue by Customer</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={loadReport} disabled={loading}>{loading ? 'Loading...' : 'Generate'}</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : report ? (
        <div className="space-y-6">
          {report.type === 'profit_loss' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Revenue</div>
                <div className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(report.revenue as number)}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Expenses</div>
                <div className="mt-1 text-xl font-bold text-rose-600">{formatCurrency(report.expenses as number)}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Net Profit</div>
                <div className={`mt-1 text-xl font-bold ${(report.netProfit as number) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(report.netProfit as number)}</div>
              </div>
            </div>
          )}

          {report.type === 'cash_flow' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Inflows</div>
                <div className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(report.inflows as number)}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Outflows</div>
                <div className="mt-1 text-xl font-bold text-rose-600">{formatCurrency(report.outflows as number)}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Net Cash Flow</div>
                <div className={`mt-1 text-xl font-bold ${(report.netCashFlow as number) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(report.netCashFlow as number)}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">Closing Balance</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(report.closingBalance as number)}</div>
              </div>
            </div>
          )}

          {report.type === 'aging' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Accounts Receivable (AR)</h3>
                <div className="space-y-2">
                  {Object.entries((report.ar as Record<string, unknown>).buckets as Record<string, { count: number; total: number }> || {}).map(([bucket, data]) => (
                    <div key={bucket} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2">
                      <span className="text-sm text-slate-700">{bucket} days</span>
                      <span className="text-sm font-medium text-slate-900">{data.count} invoices • {formatCurrency(data.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm font-bold text-slate-900">Total: {formatCurrency((report.ar as Record<string, unknown>).total as number)}</div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Accounts Payable (AP)</h3>
                <div className="space-y-2">
                  {Object.entries((report.ap as Record<string, unknown>).buckets as Record<string, { count: number; total: number }> || {}).map(([bucket, data]) => (
                    <div key={bucket} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2">
                      <span className="text-sm text-slate-700">{bucket} days</span>
                      <span className="text-sm font-medium text-slate-900">{data.count} expenses • {formatCurrency(data.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm font-bold text-slate-900">Total: {formatCurrency((report.ap as Record<string, unknown>).total as number)}</div>
              </div>
            </div>
          )}

          {report.type === 'revenue_by_customer' && (
            <div className="space-y-2">
              {(report.customers as Array<{ customer_name: string; customer_reference: string; total: number; invoice_count: number }>).map((c) => (
                <div key={c.customer_reference} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{c.customer_name}</div>
                    <div className="text-xs text-slate-500">{c.invoice_count} invoices</div>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(c.total)}</div>
                </div>
              ))}
              <div className="mt-2 text-right text-sm font-bold text-slate-900">Total: {formatCurrency(report.total as number)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-400">No report data available.</div>
      )}
    </div>
  );
}