import db from './db';
import { logAudit } from './audit';
import { STAGE_FLOW } from '@/lib/types';
import type { Lead, LeadActivity, LeadInput, LeadSummary, ListFilters } from '@/lib/types';

interface LeadRow {
  id: number;
  reference: string;
  name: string;
  category: string | null;
  city: string | null;
  country: string | null;
  source: string;
  stage: string;
  priority: string;
  score: number;
  estimated_value: number;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social: string | null;
  notes: string | null;
  assigned_to: number | null;
  assigned_team: string | null;
  assigned_to_name: string | null;
  follow_up_date: string | null;
  last_contacted_at: string | null;
  reminder_days: number;
  converted_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

function now() {
  return new Date().toISOString();
}

function hydrate(row: LeadRow, activities: LeadActivity[]): Lead {
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    category: row.category,
    city: row.city,
    country: row.country,
    source: row.source,
    stage: row.stage,
    priority: row.priority,
    score: row.score,
    estimatedValue: row.estimated_value,
    contactName: row.contact_name,
    contactRole: row.contact_role,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    social: row.social ? safeParse(row.social) : {},
    notes: row.notes,
    assignedTo: row.assigned_to,
    assignedTeam: row.assigned_team,
    assignedToName: row.assigned_to_name,
    followUpDate: row.follow_up_date,
    lastContactedAt: row.last_contacted_at,
    reminderDays: row.reminder_days,
    convertedAt: row.converted_at,
    lostReason: row.lost_reason,
    nextStages: STAGE_FLOW[row.stage] ?? [],
    activities,
    converted: row.stage === 'won',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeParse(v: string): Record<string, string> {
  try {
    return JSON.parse(v) ?? {};
  } catch {
    return {};
  }
}

function loadActivities(leadId: number): LeadActivity[] {
  const rows = db
    .prepare('SELECT id, kind, summary, outcome, actor, created_at FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC')
    .all(leadId) as Array<{
    id: number;
    kind: string;
    summary: string;
    outcome: string | null;
    actor: string;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    summary: r.summary,
    outcome: r.outcome,
    actor: r.actor,
    createdAt: r.created_at,
  }));
}

const SELECT_BASE = `
SELECT l.*, p.name AS assigned_to_name
FROM leads l
LEFT JOIN people p ON p.id = l.assigned_to
`;

export function listLeads(filters: ListFilters & { page?: number } = {}): Lead[] {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conditions.push('(l.name LIKE ? OR l.city LIKE ? OR l.category LIKE ? OR l.contact_name LIKE ? OR l.contact_email LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q, q, q);
  }
  if (filters.stage) {
    conditions.push('l.stage = ?');
    params.push(filters.stage);
  }
  if (filters.priority) {
    conditions.push('l.priority = ?');
    params.push(filters.priority);
  }
  if (filters.source) {
    conditions.push('l.source = ?');
    params.push(filters.source);
  }
  if (filters.assignedTo) {
    conditions.push('l.assigned_to = ?');
    params.push(filters.assignedTo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`${SELECT_BASE} ${where} ORDER BY l.updated_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as LeadRow[];
  return rows.map((r) => hydrate(r, loadActivities(r.id)));
}

export function getLeadByIdOrRef(idOrRef: string): Lead | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare(`${SELECT_BASE} WHERE l.id = ?`).get(Number(idOrRef))
    : db.prepare(`${SELECT_BASE} WHERE l.reference = ?`).get(idOrRef)) as LeadRow | undefined;
  if (!row) return null;
  return hydrate(row, loadActivities(row.id));
}

export function createLead(input: LeadInput): Lead {
  const ts = now();
  const insert = db.prepare(`
    INSERT INTO leads (reference, name, category, city, country, source, stage, priority, score, estimated_value,
      contact_name, contact_role, contact_email, contact_phone, social, notes, assigned_to, assigned_team,
      follow_up_date, reminder_days, created_at, updated_at)
    VALUES (@reference, @name, @category, @city, @country, @source, @stage, @priority, @score, @estimated_value,
      @contact_name, @contact_role, @contact_email, @contact_phone, @social, @notes, @assigned_to, @assigned_team,
      @follow_up_date, @reminder_days, @created_at, @updated_at)
  `);
  const tx = db.transaction(() => {
    const info = insert.run({
      reference: 'tmp',
      name: input.name,
      category: input.category ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
      source: input.source ?? 'other',
      stage: input.stage ?? 'new',
      priority: input.priority ?? 'warm',
      score: input.score ?? 0,
      estimated_value: input.estimatedValue ?? 0,
      contact_name: input.contactName ?? null,
      contact_role: input.contactRole ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      social: JSON.stringify(input.social ?? {}),
      notes: input.notes ?? null,
      assigned_to: input.assignedTo ?? null,
      assigned_team: input.assignedTeam ?? null,
      follow_up_date: input.followUpDate ?? null,
      reminder_days: input.reminderDays ?? 3,
      created_at: ts,
      updated_at: ts,
    });
    const id = Number(info.lastInsertRowid);
    const reference = `L-${String(id).padStart(4, '0')}`;
    db.prepare('UPDATE leads SET reference = ? WHERE id = ?').run(reference, id);
    // activity
    db.prepare(
      'INSERT INTO lead_activities (lead_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)'
    ).run(id, 'created', 'Lead created', null, 'system', ts);
    return id;
  });
  const id = tx();
  const lead = getLeadByIdOrRef(String(id));
  if (!lead) throw new Error('Failed to create lead');
  return lead;
}

export function updateLead(idOrRef: string, patch: Partial<LeadInput> & { stage?: string; lostReason?: string | null; convertedAt?: string }, actor?: string): Lead {
  const existing = getLeadByIdOrRef(idOrRef);
  if (!existing) throw new Error('Lead not found');
  const id = existing.id;
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };
  const map: Record<string, string> = {
    name: 'name',
    category: 'category',
    city: 'city',
    country: 'country',
    source: 'source',
    stage: 'stage',
    priority: 'priority',
    estimatedValue: 'estimated_value',
    score: 'score',
    contactName: 'contact_name',
    contactRole: 'contact_role',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    notes: 'notes',
    assignedTo: 'assigned_to',
    assignedTeam: 'assigned_team',
    followUpDate: 'follow_up_date',
    reminderDays: 'reminder_days',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'social')) {
    fields.push('social = @social');
    params.social = JSON.stringify(patch.social ?? {});
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'lostReason')) {
    fields.push('lost_reason = @lost_reason');
    params.lost_reason = patch.lostReason ?? null;
  }
  const stageChanged = Object.prototype.hasOwnProperty.call(patch, 'stage') && patch.stage !== existing.stage;
  if (stageChanged) {
    fields.push('last_contacted_at = @last_contacted_at');
    params.last_contacted_at = now();
    if (patch.stage === 'won') {
      fields.push('converted_at = @converted_at');
      params.converted_at = now();
    }
  }
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  const sql = `UPDATE leads SET ${fields.join(', ')} WHERE id = @id`;
  db.prepare(sql).run(params);
  if (stageChanged) {
    db.prepare(
      'INSERT INTO lead_activities (lead_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)'
    ).run(id, 'stage_change', `Stage changed from ${existing.stage} to ${patch.stage}`, null, 'system', now());
  }
  const updated = getLeadByIdOrRef(String(id));
  if (!updated) throw new Error('Failed to update lead');
  return updated;
}

export function deleteLead(idOrRef: string): void {
  const existing = getLeadByIdOrRef(idOrRef);
  if (!existing) throw new Error('Lead not found');
  db.prepare('DELETE FROM leads WHERE id = ?').run(existing.id);
}

export function leadSummary(): LeadSummary {
  const totalRow = db.prepare('SELECT COUNT(*) AS c FROM leads').get() as { c: number };
  const openRow = db.prepare("SELECT COUNT(*) AS c FROM leads WHERE stage NOT IN ('won','lost','archived')").get() as { c: number };
  const wonRow = db.prepare("SELECT COUNT(*) AS c FROM leads WHERE stage = 'won'").get() as { c: number };
  const lostRow = db.prepare("SELECT COUNT(*) AS c FROM leads WHERE stage = 'lost'").get() as { c: number };
  const archivedRow = db.prepare("SELECT COUNT(*) AS c FROM leads WHERE stage = 'archived'").get() as { c: number };
  const pipelineRow = db.prepare("SELECT COALESCE(SUM(estimated_value),0) AS v FROM leads WHERE stage NOT IN ('won','lost','archived')").get() as { v: number };
  const byStageRows = db.prepare('SELECT stage, COUNT(*) AS c, COALESCE(SUM(estimated_value),0) AS v FROM leads GROUP BY stage').all() as Array<{ stage: string; c: number; v: number }>;
  const bySourceRows = db.prepare('SELECT source, COUNT(*) AS c FROM leads GROUP BY source').all() as Array<{ source: string; c: number }>;
  const byPriorityRows = db.prepare('SELECT priority, COUNT(*) AS c FROM leads GROUP BY priority').all() as Array<{ priority: string; c: number }>;
  const byStage: Record<string, { count: number; value: number }> = {};
  for (const r of byStageRows) byStage[r.stage] = { count: r.c, value: r.v };
  const bySource: Record<string, number> = {};
  for (const r of bySourceRows) bySource[r.source] = r.c;
  const byPriority: Record<string, number> = {};
  for (const r of byPriorityRows) byPriority[r.priority] = r.c;
  return {
    total: totalRow.c,
    open: openRow.c,
    won: wonRow.c,
    lost: lostRow.c,
    archived: archivedRow.c,
    pipelineValue: pipelineRow.v,
    byStage,
    bySource,
    byPriority,
  };
}



export function addLeadActivity(leadId: number, kind: string, summary: string, note: string | null, actor: string): LeadActivity {
  const ts = now();
  const info = db.prepare(
    'INSERT INTO lead_activities (lead_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)'
  ).run(leadId, kind, summary, note, actor, ts);
  const id = Number(info.lastInsertRowid);
  return { id, kind, summary, outcome: note, actor, createdAt: now() };
}

export async function convertLead(idOrRef: string, input: { businessId?: number; businessName: string; category?: string | null; notes?: string | null; actor: string }): Promise<Record<string, unknown>> {
  const lead = getLeadByIdOrRef(idOrRef);
  if (!lead) throw new Error('Lead not found');
  
  const { createCustomer } = await import('./customers');
  const customer = createCustomer({
    name: input.businessName,
    category: input.category ?? lead.category,
    city: lead.city,
    country: lead.country,
    contactName: lead.contactName,
    contactRole: lead.contactRole,
    contactEmail: lead.contactEmail,
    contactPhone: lead.contactPhone,
    social: lead.social,
    notes: input.notes ?? lead.notes,
    assignedTo: lead.assignedTo,
    assignedTeam: lead.assignedTeam,
    status: 'active',
    mrr: 0,
    totalValue: lead.estimatedValue,
    leadReference: lead.reference,
  });
  
  const updatedLead = updateLead(lead.reference, { stage: 'won' });
  
  return { customer, lead: updatedLead };
}

export function calculateLeadScore(idOrRef: string): { score: number; factors: { factor: string; points: number }[] } {
  const lead = getLeadByIdOrRef(idOrRef);
  if (!lead) throw new Error('Lead not found');
  
  let score = 0;
  const factors: { factor: string; points: number }[] = [];
  
  // Stage scoring
  const stageScores: Record<string, number> = { new: 10, contacted: 20, qualified: 40, quoted: 60, won: 100, lost: 0 };
  const stageScore = stageScores[lead.stage] || 0;
  score += stageScore;
  factors.push({ factor: `Stage: ${lead.stage}`, points: stageScore });
  
  // Estimated value scoring
  if (lead.estimatedValue > 100000) { score += 30; factors.push({ factor: 'High value (>100k)', points: 30 }); }
  else if (lead.estimatedValue > 50000) { score += 20; factors.push({ factor: 'Medium value (>50k)', points: 20 }); }
  else if (lead.estimatedValue > 10000) { score += 10; factors.push({ factor: 'Value (>10k)', points: 10 }); }
  
  // Priority scoring
  const priorityScores: Record<string, number> = { hot: 20, warm: 10, cold: 0 };
  const priorityScore = priorityScores[lead.priority] || 0;
  score += priorityScore;
  if (priorityScore > 0) factors.push({ factor: `Priority: ${lead.priority}`, points: priorityScore });
  
  // Activity scoring
  const activityCount = lead.activities.length;
  const activityScore = Math.min(activityCount * 5, 20);
  score += activityScore;
  if (activityScore > 0) factors.push({ factor: `${activityCount} activities`, points: activityScore });
  
  // Clamp score
  score = Math.min(Math.max(score, 0), 100);
  
  // Update lead score
  updateLead(idOrRef, { score });
  
  return { score, factors };
}

export function bulkSetLeadStage(ids: number[], stage: string, actor: string): void {
  const tx = db.transaction(() => {
    for (const id of ids) {
      const lead = getLeadByIdOrRef(String(id));
      if (lead) {
        updateLead(String(id), { stage }, actor);
        // Log activity
        const existing = getLeadByIdOrRef(String(id));
        if (existing) {
          db.prepare(
            'INSERT INTO lead_activities (lead_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)'
          ).run(existing.id, 'stage_change', `Stage changed to ${stage}`, null, actor, now());
        }
      }
    }
  });
  tx();
}

export function bulkAssignLeads(ids: number[], assignedTo: number, assignedTeam: string | null, actor: string): void {
  const tx = db.transaction(() => {
    for (const id of ids) {
      updateLead(String(id), { assignedTo, assignedTeam }, actor);
    }
  });
  tx();
}

export function bulkDeleteLeads(ids: number[], actor: string): void {
  const tx = db.transaction(() => {
    for (const id of ids) {
      const lead = getLeadByIdOrRef(String(id));
      if (lead) {
        deleteLead(String(id));
        // logAudit('lead', lead.reference, 'bulk_delete', `Deleted by ${actor}`, 'system');
      }
    }
  });
  tx();
}



export function listPeople() {
  const rows = db.prepare('SELECT id, code, name, email, phone, team, role, is_active FROM people ORDER BY name').all() as Array<{
    id: number; code: string; name: string; email: string | null; phone: string | null; team: string; role: string; is_active: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    team: r.team,
    role: r.role,
    isActive: r.is_active === 1,
  }));
}