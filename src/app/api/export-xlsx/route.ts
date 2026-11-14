import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entity = url.searchParams.get('entity') || 'leads';
  
  try {
    const { exportLeadsXLSX, exportCustomersXLSX, exportInvoicesXLSX, exportExpensesXLSX } = await import('@/lib/server/importExport');
    
    let buffer: Buffer;
    let filename: string;
    
    switch (entity) {
      case 'leads':
        buffer = await exportLeadsXLSX();
        filename = 'leads-export.xlsx';
        break;
      case 'customers':
        buffer = await exportCustomersXLSX();
        filename = 'customers-export.xlsx';
        break;
      case 'invoices':
        buffer = await exportInvoicesXLSX();
        filename = 'invoices-export.xlsx';
        break;
      case 'expenses':
        buffer = await exportExpensesXLSX();
        filename = 'expenses-export.xlsx';
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }
    
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}