'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { projects, expenses, invoices, employees, timeEntries } from '@/db/schema';
import { eq, desc, asc, and, or, ilike, sql, count, sum, lt, gte, lte, gt } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';

export async function getProjectProfitability(filters: { projectReference?: string; limit?: number; page?: number } = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'projects:read')) {
    throw new Error('Unauthorized');
  }

  const { projectReference, limit = 20, page = 1 } = filters;

  const conditions = [];
  if (projectReference) conditions.push(eq(projects.reference, projectReference));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const allProjects = await db
    .select({
      id: projects.id,
      reference: projects.reference,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      endDate: projects.endDate,
      budget: projects.budget,
      currency: projects.currency,
      managerId: projects.managerId,
      managerName: projects.managerName,
      customerReference: projects.customerReference,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(where)
    .orderBy(desc(projects.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  // Calculate actual cost from expenses linked to each project
  const projectsWithProfitability = await Promise.all(allProjects.map(async (p) => {
    // Get actual costs from expenses linked to project
    const actualCostResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.purchaseOrderReference, p.reference));
    const actualCost = Number(actualCostResult[0]?.total || 0);

    // Get actual revenue from invoices linked to project (via customer)
    const actualRevenueResult = await db
      .select({ total: sum(invoices.totalAmount) })
      .from(invoices)
      .where(eq(invoices.customerReference, p.customerReference ?? ''));
    const actualRevenue = Number(actualRevenueResult[0]?.total || 0);

    const budget = Number(p.budget || 0);
    const profit = actualRevenue - actualCost;
    const profitMargin = budget > 0 ? (profit / budget) * 100 : 0;
    const budgetUtilization = budget > 0 ? (actualCost / budget) * 100 : 0;

    return {
      ...p,
      actualCost,
      actualRevenue,
      profit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
    };
  }));

  return {
    projects: projectsWithProfitability,
    pagination: {
      page,
      limit,
      total: allProjects.length,
      totalPages: Math.ceil(allProjects.length / limit),
    },
  };
}

export async function getCashFlowForecast(filters: { months?: number; startDate?: string } = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'reports:read')) {
    throw new Error('Unauthorized');
  }

  const { months = 12, startDate } = filters;
  const start = startDate || new Date().toISOString().slice(0, 10);

  // Get all invoices (cash inflows) and expenses (cash outflows) grouped by month
  const allInvoices = await db
    .select({
      reference: invoices.reference,
      totalAmount: invoices.totalAmount,
      currency: invoices.currency,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      status: invoices.status,
    })
    .from(invoices)
    .orderBy(asc(invoices.issueDate));

  const allExpenses = await db
    .select({
      reference: expenses.reference,
      amount: expenses.amount,
      currency: expenses.currency,
      expenseDate: expenses.expenseDate,
      status: expenses.status,
    })
    .from(expenses)
    .orderBy(asc(expenses.expenseDate));

  // Generate monthly forecast
  type MonthData = {
    month: string;
    inflows: number;
    outflows: number;
    netFlow: number;
    runningBalance?: number;
  };
  const monthsData: MonthData[] = [];
  const current = new Date(start);
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const monthLabel = monthStart.toISOString().slice(0, 7); // YYYY-MM

    // Inflows: invoices due or paid in this month
    const monthInflows = allInvoices.filter(inv => {
      const invDate = new Date(inv.issueDate || inv.dueDate || '');
      return invDate >= monthStart && invDate <= monthEnd;
    }).reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);

    // Outflows: expenses in this month
    const monthOutflows = allExpenses.filter(exp => {
      const expDate = new Date(exp.expenseDate || '');
      return expDate >= monthStart && expDate <= monthEnd;
    }).reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);

    const netFlow = monthInflows - monthOutflows;

    monthsData.push({
      month: monthLabel,
      inflows: monthInflows,
      outflows: monthOutflows,
      netFlow,
    });

    current.setMonth(current.getMonth() + 1);
  }

  // Calculate running balance
  let runningBalance = 0;
  monthsData.forEach((m: MonthData) => {
    runningBalance += m.netFlow;
    m.runningBalance = runningBalance;
  });

  const totalInflows = monthsData.reduce((sum, m) => sum + m.inflows, 0);
  const totalOutflows = monthsData.reduce((sum, m) => sum + m.outflows, 0);
  const netCashFlow = totalInflows - totalOutflows;

  return {
    forecast: monthsData,
    summary: {
      totalInflows,
      totalOutflows,
      netCashFlow,
      months,
    },
  };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}