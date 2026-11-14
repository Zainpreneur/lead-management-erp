import { NextResponse } from 'next/server';
import { createImportJob, processCSVImport, updateImportJob } from '@/lib/server/importExport';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, fileName, csv } = body;
    
    const job = createImportJob({ entityType, fileName });
    
    // Process the import
    const result = processCSVImport(entityType, csv);
    
    updateImportJob(job.reference, {
      status: result.errors.length > 0 ? 'partial' : 'completed',
      totalRows: result.processed + result.errors.length,
      processedRows: result.processed,
      errorRows: result.errors.length,
      errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
    });
    
    return NextResponse.json({ job, result }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  const { listImportJobs } = await import('@/lib/server/importExport');
  const jobs = listImportJobs();
  return NextResponse.json({ jobs });
}