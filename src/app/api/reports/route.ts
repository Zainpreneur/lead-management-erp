import { NextResponse } from 'next/server';
import { generateProfitLoss, generateCashFlow, generateAgingReport, generateRevenueByCustomer } from '@/lib/server/financialReports';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'profit_loss';
  const startDate = url.searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const endDate = url.searchParams.get('endDate') || new Date().toISOString().slice(0, 10);
  
  try {
    let report;
    switch (type) {
      case 'profit_loss':
        report = generateProfitLoss(startDate, endDate);
        break;
      case 'cash_flow':
        report = generateCashFlow(startDate, endDate);
        break;
      case 'aging':
        report = generateAgingReport();
        break;
      case 'revenue_by_customer':
        report = generateRevenueByCustomer(startDate, endDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}