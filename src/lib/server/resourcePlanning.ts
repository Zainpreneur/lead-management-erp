import db from './db';
import type { ResourceAllocation, ResourceAllocationInput, ResourceCapacity } from '@/lib/types';

interface AllocationRow {
  id: number;
  reference: string;
  employee_reference: string;
  project_reference: string | null;
  task_reference: string | null;
  allocation_type: string;
  start_date: string;
  end_date: string | null;
  hours_per_week: number;
  utilization_percent: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CapacityRow {
  id: number;
  employee_reference: string;
  date: string;
  available_hours: number;
  allocated_hours: number;
  leave_hours: number;
  notes: string | null;
  created_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateAllocation(r: AllocationRow): ResourceAllocation {
  return {
    id: r.id,
    reference: r.reference,
    employeeReference: r.employee_reference,
    projectReference: r.project_reference,
    taskReference: r.task_reference,
    allocationType: r.allocation_type,
    startDate: r.start_date,
    endDate: r.end_date,
    hoursPerWeek: r.hours_per_week,
    utilizationPercent: r.utilization_percent,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateCapacity(r: CapacityRow): ResourceCapacity {
  return {
    id: r.id,
    employeeReference: r.employee_reference,
    date: r.date,
    availableHours: r.available_hours,
    allocatedHours: r.allocated_hours,
    leaveHours: r.leave_hours,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export function listAllocations(filters: { employeeReference?: string; projectReference?: string; status?: string; limit?: number; page?: number } = {}): ResourceAllocation[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.employeeReference) { conds.push('employee_reference = ?'); params.push(filters.employeeReference); }
  if (filters.projectReference) { conds.push('project_reference = ?'); params.push(filters.projectReference); }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM resource_allocations ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as AllocationRow[];
  return rows.map(hydrateAllocation);
}

export function createAllocation(input: ResourceAllocationInput): ResourceAllocation {
  const ts = now();
  const info = db.prepare(`INSERT INTO resource_allocations (reference, employee_reference, project_reference, task_reference, allocation_type, start_date, end_date, hours_per_week, utilization_percent, status, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.employeeReference, input.projectReference ?? null, input.taskReference ?? null, input.allocationType ?? 'project', input.startDate, input.endDate ?? null, input.hoursPerWeek ?? 40, input.utilizationPercent ?? 100, input.status ?? 'active', input.notes ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `ALLOC-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE resource_allocations SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM resource_allocations WHERE id = ?').get(id) as AllocationRow;
  return hydrateAllocation(row);
}

export function updateAllocation(idOrRef: string, patch: Partial<ResourceAllocationInput>): ResourceAllocation {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM resource_allocations WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM resource_allocations WHERE reference = ?').get(idOrRef)) as AllocationRow | undefined;
  if (!existing) throw new Error('Allocation not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    employeeReference: 'employee_reference', projectReference: 'project_reference', taskReference: 'task_reference',
    allocationType: 'allocation_type', startDate: 'start_date', endDate: 'end_date',
    hoursPerWeek: 'hours_per_week', utilizationPercent: 'utilization_percent', status: 'status', notes: 'notes',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateAllocation(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE resource_allocations SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM resource_allocations WHERE id = ?').get(existing.id) as AllocationRow;
  return hydrateAllocation(updated);
}

export function deleteAllocation(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM resource_allocations WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM resource_allocations WHERE reference = ?').get(idOrRef)) as AllocationRow | undefined;
  if (!row) throw new Error('Allocation not found');
  db.prepare('DELETE FROM resource_allocations WHERE id = ?').run(row.id);
}

// Capacity
export function listCapacity(filters: { employeeReference?: string; date?: string; limit?: number; page?: number } = {}): ResourceCapacity[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.employeeReference) { conds.push('employee_reference = ?'); params.push(filters.employeeReference); }
  if (filters.date) { conds.push('date = ?'); params.push(filters.date); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM resource_capacity ${where} ORDER BY date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as CapacityRow[];
  return rows.map(hydrateCapacity);
}

export function createCapacity(input: { employeeReference: string; date: string; availableHours?: number; allocatedHours?: number; leaveHours?: number; notes?: string | null }): ResourceCapacity {
  const ts = now();
  const info = db.prepare(`INSERT INTO resource_capacity (employee_reference, date, available_hours, allocated_hours, leave_hours, notes, created_at) VALUES (?,?,?,?,?,?,?)`)
    .run(input.employeeReference, input.date, input.availableHours ?? 8, input.allocatedHours ?? 0, input.leaveHours ?? 0, input.notes ?? null, ts);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM resource_capacity WHERE id = ?').get(id) as CapacityRow;
  return hydrateCapacity(row);
}

// Utilization Report


export function updateCapacity(id: number, patch: { availableHours?: number; allocatedHours?: number; leaveHours?: number; notes?: string | null }): ResourceCapacity {
  const existing = db.prepare('SELECT * FROM resource_capacity WHERE id = ?').get(id) as CapacityRow | undefined;
  if (!existing) throw new Error('Capacity not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };
  const map: Record<string, string> = { availableHours: 'available_hours', allocatedHours: 'allocated_hours', leaveHours: 'leave_hours', notes: 'notes' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateCapacity(existing);
  db.prepare(`UPDATE resource_capacity SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM resource_capacity WHERE id = ?').get(id) as CapacityRow;
  return hydrateCapacity(updated);
}

export function deleteCapacity(id: number): void {
  db.prepare('DELETE FROM resource_capacity WHERE id = ?').run(id);
}

export function getUtilizationReport(startDate: string, endDate: string) {
  const allocations = db.prepare(`SELECT ra.*, e.first_name || ' ' || e.last_name AS employee_name FROM resource_allocations ra LEFT JOIN employees e ON e.reference = ra.employee_reference WHERE ra.status = 'active' AND ra.start_date <= ? AND (ra.end_date IS NULL OR ra.end_date >= ?)`).all(endDate, startDate) as Array<AllocationRow & { employee_name: string }>;
  
  const byEmployee: Record<string, { name: string; allocations: ResourceAllocation[]; totalUtilization: number }> = {};
  for (const a of allocations) {
    if (!byEmployee[a.employee_reference]) {
      byEmployee[a.employee_reference] = { name: a.employee_name, allocations: [], totalUtilization: 0 };
    }
    byEmployee[a.employee_reference].allocations.push(hydrateAllocation(a));
    byEmployee[a.employee_reference].totalUtilization += a.utilization_percent;
  }
  
  return {
    periodStart: startDate,
    periodEnd: endDate,
    byEmployee,
    totalAllocations: allocations.length,
  };
}