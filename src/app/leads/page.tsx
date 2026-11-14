import { listLeads } from '@/actions/leads';
import { listPeople } from '@/actions/people';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { formatCurrency, getStageColor, getPriorityColor } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    stage?: string;
    priority?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);

  const result = await listLeads({
    search: params.search,
    stage: params.stage as any,
    priority: params.priority as any,
    page,
    limit,
  });

  const leads = result.leads || [];
  const pagination = result.pagination;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600">Manage and track your leads</p>
        </div>
        <Link href="/leads/new" className="w-full sm:w-auto">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Lead</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="search"
                placeholder="Search leads..."
                value={params.search || ''}
                className="pl-10"
              />
            </div>
            <Select name="stage" value={params.stage || ''}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stages</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select name="priority" value={params.priority || ''}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" leftIcon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Stage</TableHead>
                <TableHead className="hidden lg:table-cell">Priority</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <TableRow key={lead.reference}>
                    <TableCell className="font-medium">
                      <Link href={`/leads/${lead.reference}`} className="hover:underline">
                        {lead.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{lead.contactName || '—'}</p>
                        <p className="text-xs text-slate-500">{lead.contactEmail || lead.contactPhone || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-600 capitalize">
                      {lead.source?.replace('_', ' ') || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className={getStageColor(lead.stage)}>
                        {lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(lead.estimatedValue || 0)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/leads/${lead.reference}`} className="text-sm text-brand-600 hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/leads?page=${page - 1}&limit=${limit}${params.search ? `&search=${params.search}` : ''}${params.stage ? `&stage=${params.stage}` : ''}${params.priority ? `&priority=${params.priority}` : ''}`}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Previous
            </a>
          )}
          <span className="px-3 py-2 text-sm text-slate-700">
            Page {page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          {page < pagination.totalPages && (
            <a
              href={`/leads?page=${page + 1}&limit=${limit}${params.search ? `&search=${params.search}` : ''}${params.stage ? `&stage=${params.stage}` : ''}${params.priority ? `&priority=${params.priority}` : ''}`}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}