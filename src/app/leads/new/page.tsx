'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createLeadSchema, type CreateLeadInput } from '@/lib/validations/leads';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { leadSourceSchema, leadStageSchema, leadPrioritySchema } from '@/lib/validations/leads';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Define the form data type to match the validated output (with defaults applied)
// Note: Fields with .optional() in schema are optional here, fields with .default() are required
// However, zodResolver uses the input type which has all .default() fields as optional
// The schema uses .nullable() on some fields, so input type includes null | undefined
type LeadFormData = {
  name: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  source?: 'google_maps' | 'referral' | 'inbound' | 'cold_call' | 'cold_email' | 'linkedin' | 'trade_show' | 'website' | 'social' | 'other';
  stage?: 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost' | 'archived';
  priority?: 'hot' | 'warm' | 'cold';
  estimatedValue?: number;
  score?: number;
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  social?: Record<string, string>;
  notes?: string | null;
  assignedTo?: number | null;
  assignedTeam?: string | null;
  followUpDate?: string;
  reminderDays?: number;
};

export default function NewLeadPage() {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: '',
      source: 'other',
      stage: 'new',
      priority: 'warm',
      estimatedValue: 0,
      score: 0,
      social: {},
      reminderDays: 3,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: z.infer<typeof createLeadSchema>) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lead');
      }

      const result = await response.json();
      router.push(`/leads/${result.lead.reference}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to create lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to create lead');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link href="/leads" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Company or contact name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  {...register('source')}
                  defaultValue="other"
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'google_maps',
                      'referral',
                      'inbound',
                      'cold_call',
                      'cold_email',
                      'linkedin',
                      'trade_show',
                      'website',
                      'social',
                      'other',
                    ].map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Stage</Label>
                <Select
                  {...register('stage')}
                  defaultValue="new"
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {['new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'archived'].map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  {...register('priority')}
                  defaultValue="warm"
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {['hot', 'warm', 'cold'].map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimatedValue">Estimated Value</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('estimatedValue', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="score">Score (0-100)</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  {...register('score', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Enterprise, SMB"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="City"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register('country')}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  {...register('contactName')}
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <Label htmlFor="contactRole">Contact Role</Label>
                <Input
                  id="contactRole"
                  {...register('contactRole')}
                  placeholder="e.g., CEO, CTO, Manager"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail')}
                  placeholder="contact@company.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-rose-600">{errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  {...register('contactPhone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Additional notes about this lead..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select
                  {...register('assignedTo', { valueAsNumber: true })}
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Unassigned</SelectItem>
                    {/* In a real app, fetch users from API */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reminderDays">Reminder (days)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="0"
                  max="365"
                  {...register('reminderDays', { valueAsNumber: true })}
                  defaultValue={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/leads">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}