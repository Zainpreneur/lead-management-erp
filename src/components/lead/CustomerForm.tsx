'use client';
import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { Customer, CustomerInput, Person } from '@/lib/types';
import { CUSTOMER_STATUS_LABELS } from '@/lib/types';

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })}
    </div>
  );
}

export function CustomerForm({ initial, people, submitting, onSubmit, onCancel }: {
  initial?: Partial<Customer>;
  people: Person[];
  submitting?: boolean;
  onSubmit: (input: CustomerInput) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [category, setCategory] = React.useState(initial?.category ?? '');
  const [city, setCity] = React.useState(initial?.city ?? '');
  const [country, setCountry] = React.useState(initial?.country ?? '');
  const [status, setStatus] = React.useState(initial?.status ?? 'active');
  const [mrr, setMrr] = React.useState(String(initial?.mrr ?? 0));
  const [totalValue, setTotalValue] = React.useState(String(initial?.totalValue ?? 0));
  const [contactName, setContactName] = React.useState(initial?.contactName ?? '');
  const [contactRole, setContactRole] = React.useState(initial?.contactRole ?? '');
  const [contactEmail, setContactEmail] = React.useState(initial?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = React.useState(initial?.contactPhone ?? '');
  const [assignedTo, setAssignedTo] = React.useState(initial?.assignedTo ? String(initial.assignedTo) : '');
  const [assignedTeam, setAssignedTeam] = React.useState(initial?.assignedTeam ?? '');
  const [leadReference, setLeadReference] = React.useState(initial?.leadReference ?? '');
  const [notes, setNotes] = React.useState(initial?.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const input: CustomerInput = {
      name: name.trim(),
      category: category || null,
      city: city || null,
      country: country || null,
      status,
      mrr: Number(mrr) || 0,
      totalValue: Number(totalValue) || 0,
      contactName: contactName || null,
      contactRole: contactRole || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      assignedTo: assignedTo ? Number(assignedTo) : null,
      assignedTeam: assignedTeam || null,
      leadReference: leadReference || null,
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
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
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
            <Field label="Lead Reference">
              <Input value={leadReference} onChange={(e) => setLeadReference(e.target.value)} placeholder="L-0001" />
            </Field>
            <Field label="MRR">
              <Input type="number" value={mrr} onChange={(e) => setMrr(e.target.value)} />
            </Field>
            <Field label="Total Value">
              <Input type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} />
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
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Customer'}</Button>
      </div>
    </form>
  );
}