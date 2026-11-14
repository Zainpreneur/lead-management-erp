'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Contact } from '@/lib/types';

export default function ContactsPage() {
  const toast = useToast();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Contact | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', customerReference: '', role: '', email: '', phone: '', accountName: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listContacts();
      setContacts(res.contacts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createContact(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Contact created' });
      setForm({ name: '', customerReference: '', role: '', email: '', phone: '', accountName: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create contact', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, customerReference: c.customerReference ?? '', role: c.role ?? '', email: c.email ?? '', phone: c.phone ?? '', accountName: c.accountName ?? '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateContact(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Contact updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update contact', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Contacts</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{contacts.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.reference} • {c.role || '—'} • {c.email || '—'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-xs text-brand-600 hover:underline">Edit</button>
                  <button onClick={async () => { if (confirm('Delete?')) { await api.deleteContact(c.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {contacts.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No contacts.</div>}
        </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Contact">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer Ref</label>
              <Input value={form.customerReference} onChange={(e) => setForm({ ...form, customerReference: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Account Name</label>
              <Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Contact">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer Ref</label>
              <Input value={form.customerReference} onChange={(e) => setForm({ ...form, customerReference: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Account Name</label>
              <Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}