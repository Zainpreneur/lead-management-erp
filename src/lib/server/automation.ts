import db from './db';
import type { WorkflowRule, EmailTemplate, ScheduledReport, Notification } from '@/lib/types';

interface WorkflowRow {
  id: number;
  reference: string;
  name: string;
  trigger_event: string;
  conditions: string;
  actions: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface TemplateRow {
  id: number;
  reference: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface ScheduledReportRow {
  id: number;
  reference: string;
  name: string;
  report_type: string;
  schedule: string;
  recipients: string;
  filters: string;
  is_active: number;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

interface NotificationRow {
  id: number;
  reference: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_reference: string | null;
  is_read: number;
  created_at: string;
}

function now() { return new Date().toISOString(); }

function parseJSON(s: string | null): unknown {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function hydrateWorkflow(r: WorkflowRow): WorkflowRule {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    triggerEvent: r.trigger_event,
    conditions: (parseJSON(r.conditions) as unknown[]) ?? [],
    actions: (parseJSON(r.actions) as unknown[]) ?? [],
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateTemplate(r: TemplateRow): EmailTemplate {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    subject: r.subject,
    body: r.body,
    type: r.type,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateScheduledReport(r: ScheduledReportRow): ScheduledReport {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    reportType: r.report_type,
    schedule: r.schedule,
    recipients: (parseJSON(r.recipients) as string[]) ?? [],
    filters: (parseJSON(r.filters) as Record<string, unknown>) ?? {},
    isActive: r.is_active === 1,
    lastRun: r.last_run,
    nextRun: r.next_run,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    reference: r.reference,
    type: r.type,
    title: r.title,
    message: r.message,
    entityType: r.entity_type,
    entityReference: r.entity_reference,
    isRead: r.is_read === 1,
    createdAt: r.created_at,
  };
}

// Workflow Rules
export function listWorkflowRules(filters: { triggerEvent?: string; isActive?: boolean; limit?: number; page?: number } = {}): WorkflowRule[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.triggerEvent) { conds.push('trigger_event = ?'); params.push(filters.triggerEvent); }
  if (filters.isActive !== undefined) { conds.push('is_active = ?'); params.push(filters.isActive ? 1 : 0); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM workflow_rules ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as WorkflowRow[];
  return rows.map(hydrateWorkflow);
}

export function createWorkflowRule(input: { name: string; triggerEvent: string; conditions?: unknown[]; actions?: unknown[]; isActive?: boolean }): WorkflowRule {
  const ts = now();
  const info = db.prepare(`INSERT INTO workflow_rules (reference, name, trigger_event, conditions, actions, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.triggerEvent, JSON.stringify(input.conditions ?? []), JSON.stringify(input.actions ?? []), input.isActive !== false ? 1 : 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `WF-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE workflow_rules SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(id) as WorkflowRow;
  return hydrateWorkflow(row);
}



export function updateWorkflowRule(idOrRef: string, patch: { name?: string; triggerEvent?: string; conditions?: unknown[]; actions?: unknown[]; isActive?: boolean }): WorkflowRule {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM workflow_rules WHERE reference = ?').get(idOrRef)) as WorkflowRow | undefined;
  if (!existing) throw new Error('Workflow rule not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', triggerEvent: 'trigger_event', isActive: 'is_active' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'conditions')) {
    fields.push('conditions = @conditions');
    params.conditions = JSON.stringify(patch.conditions ?? []);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'actions')) {
    fields.push('actions = @actions');
    params.actions = JSON.stringify(patch.actions ?? []);
  }
  if (!fields.length) return hydrateWorkflow(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE workflow_rules SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(existing.id) as WorkflowRow;
  return hydrateWorkflow(updated);
}

export function deleteWorkflowRule(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM workflow_rules WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM workflow_rules WHERE reference = ?').get(idOrRef)) as WorkflowRow | undefined;
  if (!row) throw new Error('Workflow rule not found');
  db.prepare('DELETE FROM workflow_rules WHERE id = ?').run(row.id);
}

// Email Templates
export function listEmailTemplates(filters: { type?: string; isActive?: boolean; limit?: number; page?: number } = {}): EmailTemplate[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.type) { conds.push('type = ?'); params.push(filters.type); }
  if (filters.isActive !== undefined) { conds.push('is_active = ?'); params.push(filters.isActive ? 1 : 0); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM email_templates ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TemplateRow[];
  return rows.map(hydrateTemplate);
}

export function createEmailTemplate(input: { name: string; subject: string; body: string; type?: string; isActive?: boolean }): EmailTemplate {
  const ts = now();
  const info = db.prepare(`INSERT INTO email_templates (reference, name, subject, body, type, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.subject, input.body, input.type ?? 'email', input.isActive !== false ? 1 : 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TPL-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE email_templates SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id) as TemplateRow;
  return hydrateTemplate(row);
}



export function updateEmailTemplate(idOrRef: string, patch: { name?: string; subject?: string; body?: string; type?: string; isActive?: boolean }): EmailTemplate {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM email_templates WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM email_templates WHERE reference = ?').get(idOrRef)) as TemplateRow | undefined;
  if (!existing) throw new Error('Template not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', subject: 'subject', body: 'body', type: 'type', isActive: 'is_active' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateTemplate(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE email_templates SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(existing.id) as TemplateRow;
  return hydrateTemplate(updated);
}

export function deleteEmailTemplate(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM email_templates WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM email_templates WHERE reference = ?').get(idOrRef)) as TemplateRow | undefined;
  if (!row) throw new Error('Template not found');
  db.prepare('DELETE FROM email_templates WHERE id = ?').run(row.id);
}

// Scheduled Reports
export function listScheduledReports(filters: { isActive?: boolean; limit?: number; page?: number } = {}): ScheduledReport[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.isActive !== undefined) { conds.push('is_active = ?'); params.push(filters.isActive ? 1 : 0); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM scheduled_reports ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as ScheduledReportRow[];
  return rows.map(hydrateScheduledReport);
}

export function createScheduledReport(input: { name: string; reportType: string; schedule?: string; recipients?: string[]; filters?: Record<string, unknown>; isActive?: boolean }): ScheduledReport {
  const ts = now();
  const info = db.prepare(`INSERT INTO scheduled_reports (reference, name, report_type, schedule, recipients, filters, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.reportType, input.schedule ?? 'daily', JSON.stringify(input.recipients ?? []), JSON.stringify(input.filters ?? {}), input.isActive !== false ? 1 : 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `SR-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE scheduled_reports SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM scheduled_reports WHERE id = ?').get(id) as ScheduledReportRow;
  return hydrateScheduledReport(row);
}



export function updateScheduledReport(idOrRef: string, patch: { name?: string; reportType?: string; schedule?: string; recipients?: string[]; filters?: Record<string, unknown>; isActive?: boolean }): ScheduledReport {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM scheduled_reports WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM scheduled_reports WHERE reference = ?').get(idOrRef)) as ScheduledReportRow | undefined;
  if (!existing) throw new Error('Scheduled report not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', reportType: 'report_type', schedule: 'schedule', isActive: 'is_active' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'recipients')) {
    fields.push('recipients = @recipients');
    params.recipients = JSON.stringify(patch.recipients ?? []);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'filters')) {
    fields.push('filters = @filters');
    params.filters = JSON.stringify(patch.filters ?? {});
  }
  if (!fields.length) return hydrateScheduledReport(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE scheduled_reports SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM scheduled_reports WHERE id = ?').get(existing.id) as ScheduledReportRow;
  return hydrateScheduledReport(updated);
}

export function deleteScheduledReport(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM scheduled_reports WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM scheduled_reports WHERE reference = ?').get(idOrRef)) as ScheduledReportRow | undefined;
  if (!row) throw new Error('Scheduled report not found');
  db.prepare('DELETE FROM scheduled_reports WHERE id = ?').run(row.id);
}

// Notifications
export function listNotifications(filters: { isRead?: boolean; limit?: number; page?: number } = {}): Notification[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.isRead !== undefined) { conds.push('is_read = ?'); params.push(filters.isRead ? 1 : 0); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as NotificationRow[];
  return rows.map(hydrateNotification);
}

export function createNotification(input: { type?: string; title: string; message: string; entityType?: string | null; entityReference?: string | null }): Notification {
  const ts = now();
  const info = db.prepare(`INSERT INTO notifications (reference, type, title, message, entity_type, entity_reference, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('tmp', input.type ?? 'info', input.title, input.message, input.entityType ?? null, input.entityReference ?? null, 0, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `NOTIF-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE notifications SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as NotificationRow;
  return hydrateNotification(row);
}

export function markNotificationRead(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM notifications WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM notifications WHERE reference = ?').get(idOrRef)) as NotificationRow | undefined;
  if (!row) throw new Error('Notification not found');
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(row.id);
}

export function deleteNotification(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM notifications WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM notifications WHERE reference = ?').get(idOrRef)) as NotificationRow | undefined;
  if (!row) throw new Error('Notification not found');
  db.prepare('DELETE FROM notifications WHERE id = ?').run(row.id);
}