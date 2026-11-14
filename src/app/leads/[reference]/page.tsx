import { getLead } from '@/actions/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { formatCurrency, formatDate, getStageColor, getPriorityColor } from '@/lib/utils';
import { Edit, Trash2, ArrowLeft, User, Mail, Phone, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

interface LeadPageProps {
  params: Promise<{ reference: string }>;
}

export default async function LeadDetailPage({ params }: LeadPageProps) {
  const { reference } = await params;
  const result = await getLead(reference);

  if (!result.lead) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="py-12">
            <h2 className="text-xl font-bold text-slate-900">Lead not found</h2>
            <p className="mt-2 text-slate-600">The lead you're looking for doesn't exist.</p>
            <Link href="/leads" className="mt-4 inline-block">
              <Button variant="outline">Back to Leads</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lead = result.lead;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lead.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className={getStageColor(lead.stage)}>
                {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(lead.priority)}>
                {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/leads/${lead.reference}/edit`}>
            <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
              Edit
            </Button>
          </Link>
          <Button variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />} className="text-rose-600 hover:bg-rose-50">
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(lead.contactName || lead.contactEmail || lead.contactPhone) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lead.contactName && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <User className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Contact Name</p>
                        <p className="font-medium">{lead.contactName}</p>
                      </div>
                    </div>
                  )}
                  {lead.contactRole && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <User className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Role</p>
                        <p className="font-medium">{lead.contactRole}</p>
                      </div>
                    </div>
                  )}
                  {lead.contactEmail && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-medium">{lead.contactEmail}</p>
                      </div>
                    </div>
                  )}
                  {lead.contactPhone && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="font-medium">{lead.contactPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Source */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {lead.city && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">City</p>
                      <p className="font-medium">{lead.city}{lead.country ? `, ${lead.country}` : ''}</p>
                    </div>
                  </div>
                )}
                {lead.country && !lead.city && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Country</p>
                      <p className="font-medium">{lead.country}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Estimated Value</p>
                    <p className="font-medium text-lg">{formatCurrency(lead.estimatedValue || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Source</p>
                    <p className="font-medium capitalize">{lead.source?.replace('_', ' ') || '—'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          {(lead.category || lead.assignedToName || lead.assignedTeam || lead.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {lead.category && (
                    <div>
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="font-medium">{lead.category}</p>
                    </div>
                  )}
                  {lead.assignedToName && (
                    <div>
                      <p className="text-xs text-slate-500">Assigned To</p>
                      <p className="font-medium">{lead.assignedToName}</p>
                    </div>
                  )}
                  {lead.assignedTeam && (
                    <div>
                      <p className="text-xs text-slate-500">Team</p>
                      <p className="font-medium">{lead.assignedTeam}</p>
                    </div>
                  )}
                  {lead.followUpDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Follow Up</p>
                        <p className="font-medium">{formatDate(lead.followUpDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
                {lead.notes && (
                  <div>
                    <p className="text-xs text-slate-500">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activities */}
          {lead.activities && lead.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lead.activities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 border border-slate-200 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-brand-500" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.summary}</p>
                        <p className="text-xs text-slate-500">
                          {activity.kind} • {activity.actor} • {formatDate(activity.createdAt)}
                        </p>
                        {activity.outcome && (
                          <p className="text-xs text-slate-600 mt-1">Outcome: {activity.outcome}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Reference</dt>
                  <dd className="font-mono font-medium">{lead.reference}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Score</dt>
                  <dd className="font-medium">{lead.score}/100</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Reminder</dt>
                  <dd className="font-medium">{lead.reminderDays} days</dd>
                </div>
                {lead.convertedAt && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Converted</dt>
                    <dd className="font-medium">{formatDate(lead.convertedAt)}</dd>
                  </div>
                )}
                {lead.lostReason && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Lost Reason</dt>
                    <dd className="font-medium text-rose-600">{lead.lostReason}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="font-medium">{formatDate(lead.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Updated</dt>
                  <dd className="font-medium">{formatDate(lead.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/leads/${lead.reference}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start" leftIcon={<Edit className="h-4 w-4" />}>
                  Edit Lead
                </Button>
              </Link>
              {lead.stage !== 'won' && lead.stage !== 'lost' && (
                <Button variant="default" className="w-full justify-start" onClick={() => {}}>
                  Convert to Customer
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" onClick={() => {}}>
                Create Proposal
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => {}}>
                Create Task
              </Button>
              <Button variant="ghost" className="w-full justify-start text-rose-600" onClick={() => {}}>
                Delete Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}