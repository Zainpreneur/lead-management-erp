import { Card } from '@/components/ui/Card';
import { Money } from './Money';
import { cn } from '@/lib/cn';

const accentMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-brand-100', text: 'text-brand-700', icon: 'text-brand-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'text-rose-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-600' },
};

export function StatCard({ label, value, money, accent, trend }: { label: string; value: number | string; money?: boolean; accent?: string; trend?: { value: number; positive: boolean } }) {
  const colors = accent ? accentMap[accent] : accentMap.slate;
  
  return (
    <Card className="transition-all duration-150 hover:shadow-md">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          {trend && (
            <span className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-rose-600')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className={`mt-1 text-2xl font-bold ${colors.text}`}>
          {money ? <Money value={Number(value)} /> : value}
        </div>
      </div>
    </Card>
  );
}