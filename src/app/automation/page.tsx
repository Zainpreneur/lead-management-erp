'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { EmailTemplate, ScheduledReport, Notification } from '@/lib/types';
import { NOTIFICATION_TYPE_LABELS } from '@/lib/types';

export default function AutomationPage() {
  const toast = useToast();
  const [tab, setTab] = React.useState<'templates' | 'notifications' | 'scheduled'>('templates');
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [scheduledReports, setScheduledReports] = React.useState<ScheduledReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [templateForm, setTemplateForm] = React.useState({ name: '', subject: '', body: '', type: 'email' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, n, sr] = await Promise.all([
        api.listEmailTemplates({ limit: pageSize, page }),
        api.listNotifications({ limit: pageSize, page }),
        api.listScheduledReports({ limit: pageSize, page }),
      ]);
      setTemplates(t.templates as unknown as EmailTemplate[]);
      setNotifications(n.notifications as unknown as Notification[]);
      setScheduledReports(sr.reports as unknown as ScheduledReport[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmailTemplate(templateForm);
      toast.add({ variant: 'success', title: 'Template created' });
      setTemplateForm({ name: '', subject: '', body: '', type: 'email' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create template', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleMarkRead = async (ref: string) => {
    try {
      await api.markNotificationRead(ref);
      await load();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Automation</span>
          <div className="flex gap-2">
            {tab === 'templates' && <Button size="sm" onClick={() => { /* create template */ }}>+ Template</Button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-md border border-slate-200 bg-white p-1">
        {(['templates', 'notifications', 'scheduled'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t === 'templates' ? 'Templates' : t === 'notifications' ? 'Notifications' : 'Scheduled'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          {!loading && tab === 'templates' && (
            <div className="space-y-3">
              {templates.map((t) => (
                <div key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.reference} • {t.type} • {t.subject}</div>
                    </div>
                    <button onClick={async () => { await api.deleteEmailTemplate(t.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No templates.</div>}
            </div>
          )}

          {!loading && tab === 'notifications' && (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className={`rounded-md border border-slate-200 bg-white p-4 ${!n.isRead ? 'border-l-4 border-l-brand-500' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <div className="text-xs text-slate-500">{NOTIFICATION_TYPE_LABELS[n.type] ?? n.type} • {new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      {!n.isRead && <button onClick={() => handleMarkRead(n.reference)} className="text-xs text-brand-600 hover:underline">Mark Read</button>}
                      <button onClick={async () => { await api.deleteNotification(n.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); }} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No notifications.</div>}
            </div>
          )}

          {!loading && tab === 'scheduled' && (
            <div className="space-y-3">
              {scheduledReports.map((r) => (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.reference} • {r.reportType} • {r.schedule} • {r.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                    <button onClick={async () => { await api.deleteScheduledReport(r.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
              {scheduledReports.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No scheduled reports.</div>}
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={(tab === 'templates' ? templates : tab === 'notifications' ? notifications : scheduledReports).length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      {/* Create Template Modal */}
      <Modal open={tab === 'templates' && false} onClose={() => {}} title="New Email Template">
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
            <Input value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Body *</label>
            <Textarea value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} rows={5} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <Select value={templateForm.type} onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setTab('templates')}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
