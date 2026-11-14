import { NextResponse } from 'next/server';
import db from '@/lib/server/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '30d';
  
  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = now.toISOString().slice(0, 10);

    // Pipeline by stage
    const pipelineByStage = db.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as value
      FROM leads GROUP BY stage
    `).all() as Array<{ stage: string; count: number; value: number }>;

    // Revenue by month
    const revenueByMonth = db.prepare(`
      SELECT strftime('%Y-%m', issue_date) as month, COALESCE(SUM(total_amount), 0) as total
      FROM invoices WHERE status IN ('sent', 'paid') AND issue_date >= ? AND issue_date <= ?
      GROUP BY strftime('%Y-%m', issue_date)
      ORDER BY month
    `).all(startStr, endStr) as Array<{ month: string; total: number }>;

    // Leads by source
    const leadsBySource = db.prepare(`
      SELECT source, COUNT(*) as count
      FROM leads GROUP BY source
    `).all() as Array<{ source: string; count: number }>;

    // Leads by priority
    const leadsByPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM leads GROUP BY priority
    `).all() as Array<{ priority: string; count: number }>;

    // Conversion rate
    const totalLeads = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number }).c;
    const wonLeads = (db.prepare("SELECT COUNT(*) as c FROM leads WHERE stage = 'won'").get() as { c: number }).c;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads * 100) : 0;

    // Expenses by category
    const expensesByCategory = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE status IN ('approved', 'paid') AND expense_date >= ? AND expense_date <= ?
      GROUP BY category
    `).all(startStr, endStr) as Array<{ category: string; total: number }>;

    // Cash flow by month
    const cashFlowByMonth = db.prepare(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN type IN ('deposit', 'receipt') THEN amount ELSE 0 END) as inflows,
        SUM(CASE WHEN type IN ('withdrawal', 'payment') THEN amount ELSE 0 END) as outflows
      FROM cash_transactions
      WHERE transaction_date >= ? AND transaction_date <= ?
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month
    `).all(startStr, endStr) as Array<{ month: string; inflows: number; outflows: number }>;

    // Task completion
    const tasksByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM tasks GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    // Invoice status breakdown
    const invoicesByStatus = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM invoices GROUP BY status
    `).all() as Array<{ status: string; count: number; total: number }>;

    // Top customers by revenue
    const topCustomers = db.prepare(`
      SELECT customer_name, COALESCE(SUM(total_amount), 0) as total
      FROM invoices WHERE status IN ('sent', 'paid')
      GROUP BY customer_reference
      ORDER BY total DESC
      LIMIT 5
    `).all() as Array<{ customer_name: string; total: number }>;

    // Recent activity count
    const recentActivity = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= ?
    `).get(startStr) as { count: number };

    return NextResponse.json({
      period,
      startDate: startStr,
      endDate: endStr,
      pipelineByStage,
      revenueByMonth,
      leadsBySource,
      leadsByPriority,
      conversionRate,
      totalLeads,
      wonLeads,
      expensesByCategory,
      cashFlowByMonth,
      tasksByStatus,
      invoicesByStatus,
      topCustomers,
      recentActivity: recentActivity.count,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}