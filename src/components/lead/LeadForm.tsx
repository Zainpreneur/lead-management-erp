'use client';
import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { Lead, LeadInput, Person } from '@/lib/types';
import { SOURCE_LABELS, STAGE_LABELS, PRIORITY_LABELS } from '@/lib/types';

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })}
    </div>
  );
}

export interface LeadFormProps {
  initial?: Partial<Lead>;
  people: Person[];
  submitting?: boolean;
  onSubmit: (input: LeadInput) => void | Promise<void>;
  onCancel?: () => void;
}

export function LeadForm({ initial, people, submitting, onSubmit, onCancel }: LeadFormProps) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [category, setCategory] = React.useState(initial?.category ?? '');
  const [city, setCity] = React.useState(initial?.city ?? '');
  const [country, setCountry] = React.useState(initial?.country ?? '');
  const [source, setSource] = React.useState(initial?.source ?? 'other');
  const [stage, setStage] = React.useState(initial?.stage ?? 'new');
  const [priority, setPriority] = React.useState(initial?.priority ?? 'warm');
  const [estimatedValue, setEstimatedValue] = React.useState(String(initial?.estimatedValue ?? 0));
  const [score, setScore] = React.useState(String(initial?.score ?? 0));
  const [contactName, setContactName] = React.useState(initial?.contactName ?? '');
  const [contactRole, setContactRole] = React.useState(initial?.contactRole ?? '');
  const [contactEmail, setContactEmail] = React.useState(initial?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = React.useState(initial?.contactPhone ?? '');
  const [assignedTo, setAssignedTo] = React.useState(initial?.assignedTo ? String(initial.assignedTo) : '');
  const [assignedTeam, setAssignedTeam] = React.useState(initial?.assignedTeam ?? '');
  const [followUpDate, setFollowUpDate] = React.useState(initial?.followUpDate ?? '');
  const [reminderDays, setReminderDays] = React.useState(String(initial?.reminderDays ?? 3));
  const [notes, setNotes] = React.useState(initial?.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const input: LeadInput = {
      name: name.trim(),
      category: category || null,
      city: city || null,
      country: country || null,
      source,
      stage,
      priority,
      estimatedValue: Number(estimatedValue) || 0,
      score: Number(score) || 0,
      contactName: contactName || null,
      contactRole: contactRole || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      assignedTo: assignedTo ? Number(assignedTo) : null,
      assignedTeam: assignedTeam || null,
      followUpDate: followUpDate || null,
      reminderDays: Number(reminderDays) || 3,
      notes: notes || null,
    };
    await onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Software" />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
            <Field label="Source">
              <Select value={source} onChange={(e) => setSource(e.target.value)}>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Stage">
              <Select value={stage} onChange={(e) => setStage(e.target.value)}>
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estimated Value">
              <Input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
            </Field>
            <Field label="Score (0-100)">
              <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
            <Field label="Assigned To">
              <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">Unassigned</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Assigned Team">
              <Input value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)} />
            </Field>
            <Field label="Follow-up Date">
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </Field>
            <Field label="Reminder (days)">
              <Input type="number" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Name">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </Field>
            <Field label="Contact Role">
              <Input value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
            </Field>
            <Field label="Contact Email">
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </Field>
            <Field label="Contact Phone">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Lead'}</Button>
      </div>
    </form>
  );
}