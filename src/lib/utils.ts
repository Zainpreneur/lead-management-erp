import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REF_COUNTERS = new Map<string, number>();

export async function generateReference(prefix: string): Promise<string> {
  // Get the count for this prefix from database
  const tableMap: Record<string, string> = {
    LEAD: 'leads',
    CUST: 'customers',
    INV: 'invoices',
    PAY: 'payments',
    PROP: 'proposals',
    TASK: 'tasks',
    PROD: 'products',
    CONT: 'contacts',
    EXP: 'expenses',
    VEN: 'vendors',
    PO: 'purchase_orders',
    GR: 'goods_receipts',
    AST: 'assets',
    AC: 'asset_categories',
    AP: 'approval_chains',
    SR: 'service_requests',
    TKT: 'helpdesk_tickets',
    EMP: 'employees',
    PRJ: 'projects',
    SRQ: 'sourcing_requests',
    VQU: 'vendor_quotes',
    VC: 'vendor_contracts',
    VP: 'vendor_payouts',
    VINV: 'vendor_invoices',
    VCN: 'vendor_credit_notes',
    QI: 'quality_inspections',
    NCR: 'non_conformance_reports',
    WR: 'workflow_rules',
    ET: 'email_templates',
    SRP: 'scheduled_reports',
    NOT: 'notifications',
    WF: 'workflows',
    SLA: 'sla_rules',
    TEN: 'tenants',
    IMP: 'import_jobs',
    TAG: 'tags',
    DW: 'dashboard_widgets',
    DC: 'dashboard_configs',
  };

  const tableName = tableMap[prefix];
  if (!tableName) {
    throw new Error(`Unknown reference prefix: ${prefix}`);
  }

  // Use a simple counter in memory for now, could be made persistent
  const current = REF_COUNTERS.get(prefix) || 0;
  const next = current + 1;
  REF_COUNTERS.set(prefix, next);

  // Format: PREFIX-0001
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    new: 'slate',
    contacted: 'blue',
    qualified: 'indigo',
    quoted: 'purple',
    won: 'emerald',
    lost: 'rose',
    archived: 'slate',
  };
  return colors[stage] || 'slate';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    hot: 'rose',
    warm: 'amber',
    cold: 'blue',
    high: 'rose',
    medium: 'amber',
    low: 'blue',
    urgent: 'red',
    normal: 'blue',
  };
  return colors[priority] || 'slate';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'emerald',
    inactive: 'slate',
    suspended: 'amber',
    blacklisted: 'rose',
    draft: 'slate',
    sent: 'blue',
    paid: 'emerald',
    overdue: 'rose',
    cancelled: 'rose',
    void: 'slate',
    pending: 'amber',
    approved: 'emerald',
    rejected: 'rose',
    completed: 'emerald',
    in_progress: 'blue',
    open: 'blue',
    closed: 'emerald',
    new: 'blue',
    resolved: 'emerald',
  };
  return colors[status] || 'slate';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}