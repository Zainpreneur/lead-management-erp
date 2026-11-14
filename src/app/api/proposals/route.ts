import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { z } from 'zod';
import { listProposals, createProposal } from '@/lib/server/proposals';
import { proposalInputSchema } from '@/lib/server/proposalValidation';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'proposals:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const proposals = listProposals({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    leadReference: url.searchParams.get('leadReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'proposals:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = proposalInputSchema.parse(body);
    const proposal = createProposal(parsed);
    try { await logAudit('proposal', proposal.reference, 'created', `Proposal ${proposal.title} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
