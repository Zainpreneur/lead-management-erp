import { NextResponse } from 'next/server';
import { exportLeadsCSV, exportCustomersCSV, exportInvoicesCSV, exportExpensesCSV } from '@/lib/server/platform';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entity = url.searchParams.get('entity') || 'leads';
  
  let csv = '';
  let filename = 'export.csv';
  
  switch (entity) {
    case 'leads':
      csv = exportLeadsCSV();
      filename = 'leads-export.csv';
      break;
    case 'customers':
      csv = exportCustomersCSV();
      filename = 'customers-export.csv';
      break;
    case 'invoices':
      csv = exportInvoicesCSV();
      filename = 'invoices-export.csv';
      break;
    case 'expenses':
      csv = exportExpensesCSV();
      filename = 'expenses-export.csv';
      break;
    default:
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  }
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}