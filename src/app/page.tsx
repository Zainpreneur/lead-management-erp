'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  pipelineByStage: Array<{ stage: string; count: number; value: number }>;
  revenueByMonth: Array<{ month: string; total: number }>;
  leadsBySource: Array<{ source: string; count: number }>;
  leadsByPriority: Array<{ priority: string; count: number }>;
  conversionRate: number;
  totalLeads: number;
  wonLeads: number;
  expensesByCategory: Array<{ category: string; total: number }>;
  cashFlowByMonth: Array<{ month: string; inflows: number; outflows: number }>;
  tasksByStatus: Array<{ status: string; count: number }>;
  invoicesByStatus: Array<{ status: string; count: number; total: number }>;
  topCustomers: Array<{ customer_name: string; total: number }>;
  recentActivity: number;
}

// Simple bar chart component
function BarChart({ data, color = 'brand' }: { data: Array<{ label: string; value: number }>; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-24 truncate text-xs text-slate-600">{d.label}</div>
          <div className="flex-1">
            <div className="h-4 rounded bg-slate-100">
              <div className={`h-4 rounded bg-${color}-500`} style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </div>
          <div className="w-16 text-right text-xs font-medium text-slate-900">${d.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

// Simple pie chart (donut) using SVG
function DonutChart({ data, colors }: { data: Array<{ label: string; value: number }>; colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-sm text-slate-400">No data</div>;
  
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  // Pre-compute cumulative offsets
  const offsets = data.reduce((acc, d, i) => {
    const percentage = d.value / total;
    const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative + acc[acc.length - 1].percentage : 0;
    acc.push({ percentage, cumulative: prevCumulative });
    return acc;
  }, [] as { percentage: number; cumulative: number }[]);
  
  return (
    <div className="flex items-center gap-4">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {data.map((d, i) => {
          const { percentage, cumulative } = offsets[i];
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -cumulative * circumference;
          return (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="20"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
            />
          );
        })}
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-xs text-slate-600">{d.label} ({Math.round(d.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = React.useState('30d');
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">No data available.</div>;

  const stageColors = ['#94a3b8', '#3b82f6', '#10b981', '#6366f1', '#22c55e', '#ef4444'];
  const priorityColors = ['#ef4444', '#f59e0b', '#3b82f6'];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">Analytics & insights</p>
        </div>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-32">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-slate-500">Total Leads</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{data.totalLeads}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-slate-500">Conversion Rate</div>
          <div className="mt-1 text-2xl font-bold text-brand-600">{data.conversionRate.toFixed(1)}%</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-slate-500">Won Leads</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{data.wonLeads}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-slate-500">Recent Activity</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{data.recentActivity}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline by Stage */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Pipeline by Stage</h3>
          <DonutChart
            data={data.pipelineByStage.map(s => ({ label: s.stage, value: s.value }))}
            colors={stageColors}
          />
        </div>

        {/* Leads by Source */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Leads by Source</h3>
          <BarChart
            data={data.leadsBySource.map(s => ({ label: s.source, value: s.count }))}
            color="brand"
          />
        </div>

        {/* Revenue by Month */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Revenue by Month</h3>
          <BarChart
            data={data.revenueByMonth.map(r => ({ label: r.month, value: r.total }))}
            color="emerald"
          />
        </div>

        {/* Cash Flow by Month */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Cash Flow by Month</h3>
          <div className="space-y-2">
            {data.cashFlowByMonth.map((cf, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-16 text-xs text-slate-600">{cf.month}</div>
                <div className="flex-1">
                  <div className="flex gap-1">
                    <div className="h-3 rounded bg-emerald-500" style={{ width: `${Math.min((cf.inflows / Math.max(...data.cashFlowByMonth.map(c => Math.max(c.inflows, c.outflows)), 1)) * 100, 100)}%` }} />
                    <div className="h-3 rounded bg-rose-500" style={{ width: `${Math.min((cf.outflows / Math.max(...data.cashFlowByMonth.map(c => Math.max(c.inflows, c.outflows)), 1)) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="w-20 text-right text-xs text-slate-600">
                  +${cf.inflows.toLocaleString()} / -${cf.outflows.toLocaleString()}
                </div>
              </div>
            ))}
            {data.cashFlowByMonth.length === 0 && <div className="text-sm text-slate-400">No data</div>}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Expenses by Category</h3>
          <BarChart
            data={data.expensesByCategory.map(e => ({ label: e.category, value: e.total }))}
            color="rose"
          />
        </div>

        {/* Top Customers */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Top Customers by Revenue</h3>
          <div className="space-y-2">
            {data.topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{c.customer_name}</span>
                <span className="text-sm font-medium text-slate-900">${c.total.toLocaleString()}</span>
              </div>
            ))}
            {data.topCustomers.length === 0 && <div className="text-sm text-slate-400">No data</div>}
          </div>
        </div>

        {/* Invoices by Status */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Invoices by Status</h3>
          <div className="space-y-2">
            {data.invoicesByStatus.map((inv, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 capitalize">{inv.status}</span>
                <span className="text-sm font-medium text-slate-900">{inv.count} • ${inv.total.toLocaleString()}</span>
              </div>
            ))}
            {data.invoicesByStatus.length === 0 && <div className="text-sm text-slate-400">No data</div>}
          </div>
        </div>

        {/* Tasks by Status */}
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tasks by Status</h3>
          <DonutChart
            data={data.tasksByStatus.map(t => ({ label: t.status, value: t.count }))}
            colors={['#94a3b8', '#3b82f6', '#10b981', '#ef4444']}
          />
        </div>
      </div>
    </div>
  );
}