import db from './db';

interface ReportData {
  type: string;
  periodStart: string;
  periodEnd: string;
  data: Record<string, unknown>;
}

export function generateProfitLoss(startDate: string, endDate: string): Record<string, unknown> {
  // Revenue from invoices
  const revenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status IN ('sent', 'paid') AND issue_date >= ? AND issue_date <= ?").get(startDate, endDate) as { total: number }).total;
  
  // Expenses
  const expenses = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status IN ('approved', 'paid') AND expense_date >= ? AND expense_date <= ?").get(startDate, endDate) as { total: number }).total;
  
  // Payments received
  const paymentsReceived = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND paid_at >= ? AND paid_at <= ?").get(startDate, endDate) as { total: number }).total;
  
  // Expense breakdown by category
  const expenseByCategory = db.prepare("SELECT category, COALESCE(SUM(amount), 0) as total FROM expenses WHERE status IN ('approved', 'paid') AND expense_date >= ? AND expense_date <= ? GROUP BY category").all(startDate, endDate) as Array<{ category: string; total: number }>;
  
  // Invoice breakdown by status
  const invoiceByStatus = db.prepare("SELECT status, COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM invoices WHERE issue_date >= ? AND issue_date <= ? GROUP BY status").all(startDate, endDate) as Array<{ status: string; total: number; count: number }>;
  
  return {
    type: 'profit_loss',
    periodStart: startDate,
    periodEnd: endDate,
    revenue,
    expenses,
    netProfit: revenue - expenses,
    paymentsReceived,
    expenseByCategory: expenseByCategory.reduce((acc, e) => { acc[e.category] = e.total; return acc; }, {} as Record<string, number>),
    invoiceByStatus: invoiceByStatus.reduce((acc, i) => { acc[i.status] = { total: i.total, count: i.count }; return acc; }, {} as Record<string, { total: number; count: number }>),
  };
}

export function generateCashFlow(startDate: string, endDate: string): Record<string, unknown> {
  // Cash inflows (payments received)
  const inflows = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND paid_at >= ? AND paid_at <= ?").get(startDate, endDate) as { total: number }).total;
  
  // Cash outflows (expenses paid)
  const outflows = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'paid' AND expense_date >= ? AND expense_date <= ?").get(startDate, endDate) as { total: number }).total;
  
  // Opening balance (sum of all account balances before start date)
  const openingBalance = (db.prepare("SELECT COALESCE(SUM(balance), 0) as total FROM cash_accounts WHERE is_active = 1").get() as { total: number }).total;
  
  // Transactions by type
  const transactionsByType = db.prepare("SELECT type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM cash_transactions WHERE transaction_date >= ? AND transaction_date <= ? GROUP BY type").all(startDate, endDate) as Array<{ type: string; total: number; count: number }>;
  
  // Monthly breakdown
  const monthlyBreakdown = db.prepare(`
    SELECT 
      strftime('%Y-%m', transaction_date) as month,
      SUM(CASE WHEN type IN ('deposit', 'receipt') THEN amount ELSE 0 END) as inflows,
      SUM(CASE WHEN type IN ('withdrawal', 'payment') THEN amount ELSE 0 END) as outflows
    FROM cash_transactions
    WHERE transaction_date >= ? AND transaction_date <= ?
    GROUP BY strftime('%Y-%m', transaction_date)
    ORDER BY month
  `).all(startDate, endDate) as Array<{ month: string; inflows: number; outflows: number }>;
  
  return {
    type: 'cash_flow',
    periodStart: startDate,
    periodEnd: endDate,
    inflows,
    outflows,
    netCashFlow: inflows - outflows,
    openingBalance,
    closingBalance: openingBalance + inflows - outflows,
    transactionsByType: transactionsByType.reduce((acc, t) => { acc[t.type] = { total: t.total, count: t.count }; return acc; }, {} as Record<string, { total: number; count: number }>),
    monthlyBreakdown,
  };
}

export function generateAgingReport(): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  
  // AR Aging (invoices)
  const arAging = db.prepare(`
    SELECT 
      i.reference,
      i.customer_name,
      i.total_amount,
      i.due_date,
      i.status,
      CASE 
        WHEN i.due_date >= ? THEN 'current'
        WHEN julianday(?) - julianday(i.due_date) <= 30 THEN '1-30'
        WHEN julianday(?) - julianday(i.due_date) <= 60 THEN '31-60'
        WHEN julianday(?) - julianday(i.due_date) <= 90 THEN '61-90'
        ELSE '90+'
      END as bucket
    FROM invoices i
    WHERE i.status IN ('sent', 'overdue')
    ORDER BY i.due_date ASC
  `).all(today, today, today, today) as Array<{ reference: string; customer_name: string; total_amount: number; due_date: string; status: string; bucket: string }>;
  
  // AP Aging (expenses)
  const apAging = db.prepare(`
    SELECT 
      e.reference,
      e.title,
      e.amount,
      e.expense_date,
      e.status,
      CASE 
        WHEN e.expense_date >= ? THEN 'current'
        WHEN julianday(?) - julianday(e.expense_date) <= 30 THEN '1-30'
        WHEN julianday(?) - julianday(e.expense_date) <= 60 THEN '31-60'
        WHEN julianday(?) - julianday(e.expense_date) <= 90 THEN '61-90'
        ELSE '90+'
      END as bucket
    FROM expenses e
    WHERE e.status IN ('approved', 'submitted')
    ORDER BY e.expense_date ASC
  `).all(today, today, today, today) as Array<{ reference: string; title: string; amount: number; expense_date: string; status: string; bucket: string }>;
  
  // Summarize by bucket
  const arBuckets: Record<string, { count: number; total: number }> = {};
  const apBuckets: Record<string, { count: number; total: number }> = {};
  
  for (const item of arAging) {
    if (!arBuckets[item.bucket]) arBuckets[item.bucket] = { count: 0, total: 0 };
    arBuckets[item.bucket].count++;
    arBuckets[item.bucket].total += item.total_amount;
  }
  
  for (const item of apAging) {
    if (!apBuckets[item.bucket]) apBuckets[item.bucket] = { count: 0, total: 0 };
    apBuckets[item.bucket].count++;
    apBuckets[item.bucket].total += item.amount;
  }
  
  return {
    type: 'aging',
    asOf: today,
    ar: {
      items: arAging,
      buckets: arBuckets,
      total: arAging.reduce((sum, i) => sum + i.total_amount, 0),
    },
    ap: {
      items: apAging,
      buckets: apBuckets,
      total: apAging.reduce((sum, i) => sum + i.amount, 0),
    },
  };
}

export function generateRevenueByCustomer(startDate: string, endDate: string): Record<string, unknown> {
  const rows = db.prepare(`
    SELECT 
      i.customer_name,
      i.customer_reference,
      COALESCE(SUM(i.total_amount), 0) as total,
      COUNT(*) as invoice_count
    FROM invoices i
    WHERE i.status IN ('sent', 'paid') AND i.issue_date >= ? AND i.issue_date <= ?
    GROUP BY i.customer_reference
    ORDER BY total DESC
  `).all(startDate, endDate) as Array<{ customer_name: string; customer_reference: string; total: number; invoice_count: number }>;
  
  return {
    type: 'revenue_by_customer',
    periodStart: startDate,
    periodEnd: endDate,
    customers: rows,
    total: rows.reduce((sum, r) => sum + r.total, 0),
  };
}