import db from './db';
import type { Employee, EmployeeInput, Attendance, Payroll, Project, ProjectInput, ProjectMilestone, TimeEntry, TimeEntryInput } from '@/lib/types';

interface EmployeeRow {
  id: number;
  reference: string;
  person_id: number | null;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  employment_type: string;
  classification: string;
  hire_date: string | null;
  termination_date: string | null;
  status: string;
  base_salary: number;
  currency: string;
  manager_id: number | null;
  manager_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: number;
  reference: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  currency: string;
  manager_id: number | null;
  manager_name: string | null;
  customer_reference: string | null;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id,
    reference: r.reference,
    personId: r.person_id,
    employeeNumber: r.employee_number,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    department: r.department,
    position: r.position,
    employmentType: r.employment_type,
    classification: r.classification,
    hireDate: r.hire_date,
    terminationDate: r.termination_date,
    status: r.status,
    baseSalary: r.base_salary,
    currency: r.currency,
    managerId: r.manager_id,
    managerName: r.manager_name ?? null,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateProject(r: ProjectRow): Project {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    description: r.description,
    status: r.status,
    priority: r.priority,
    startDate: r.start_date,
    endDate: r.end_date,
    budget: r.budget,
    currency: r.currency,
    managerId: r.manager_id,
    managerName: r.manager_name,
    customerReference: r.customer_reference,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Employees
export function listEmployees(filters: { search?: string; department?: string; status?: string; limit?: number; page?: number } = {}): Employee[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.department) { conds.push('department = ?'); params.push(filters.department); }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT e.*, m.first_name || ' ' || m.last_name AS manager_name FROM employees e LEFT JOIN employees m ON m.id = e.manager_id ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as EmployeeRow[];
  return rows.map(hydrateEmployee);
}

export function createEmployee(input: EmployeeInput): Employee {
  const ts = now();
  const info = db.prepare(`INSERT INTO employees (reference, person_id, employee_number, first_name, last_name, email, phone, department, position, employment_type, classification, hire_date, termination_date, status, base_salary, currency, manager_id, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.personId ?? null, input.employeeNumber ?? null, input.firstName, input.lastName, input.email ?? null, input.phone ?? null, input.department ?? null, input.position ?? null, input.employmentType ?? 'full_time', input.classification ?? 'employee', input.hireDate ?? null, input.terminationDate ?? null, input.status ?? 'active', input.baseSalary ?? 0, input.currency ?? 'USD', input.managerId ?? null, input.notes ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `EMP-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE employees SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT e.*, m.first_name || \' \' || m.last_name AS manager_name FROM employees e LEFT JOIN employees m ON m.id = e.manager_id WHERE e.id = ?').get(id) as EmployeeRow;
  return hydrateEmployee(row);
}

export function updateEmployee(idOrRef: string, patch: Partial<EmployeeInput>): Employee {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM employees WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM employees WHERE reference = ?').get(idOrRef)) as EmployeeRow | undefined;
  if (!existing) throw new Error('Employee not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    personId: 'person_id', employeeNumber: 'employee_number', firstName: 'first_name', lastName: 'last_name',
    email: 'email', phone: 'phone', department: 'department', position: 'position',
    employmentType: 'employment_type', classification: 'classification', hireDate: 'hire_date',
    terminationDate: 'termination_date', status: 'status', baseSalary: 'base_salary',
    currency: 'currency', managerId: 'manager_id', notes: 'notes',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateEmployee(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT e.*, m.first_name || \' \' || m.last_name AS manager_name FROM employees e LEFT JOIN employees m ON m.id = e.manager_id WHERE e.id = ?').get(existing.id) as EmployeeRow;
  return hydrateEmployee(updated);
}

export function deleteEmployee(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM employees WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM employees WHERE reference = ?').get(idOrRef)) as EmployeeRow | undefined;
  if (!row) throw new Error('Employee not found');
  db.prepare('DELETE FROM employees WHERE id = ?').run(row.id);
}

// Projects
export function listProjects(filters: { search?: string; status?: string; priority?: string; limit?: number; page?: number } = {}): Project[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(name LIKE ? OR description LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  if (filters.priority) { conds.push('priority = ?'); params.push(filters.priority); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT p.*, m.first_name || ' ' || m.last_name AS manager_name FROM projects p LEFT JOIN employees m ON m.id = p.manager_id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as ProjectRow[];
  return rows.map(hydrateProject);
}

export function createProject(input: ProjectInput): Project {
  const ts = now();
  const info = db.prepare(`INSERT INTO projects (reference, name, description, status, priority, start_date, end_date, budget, currency, manager_id, customer_reference, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.description ?? null, input.status ?? 'planning', input.priority ?? 'medium', input.startDate ?? null, input.endDate ?? null, input.budget ?? 0, input.currency ?? 'USD', input.managerId ?? null, input.customerReference ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `PROJ-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE projects SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT p.*, m.first_name || \' \' || m.last_name AS manager_name FROM projects p LEFT JOIN employees m ON m.id = p.manager_id WHERE p.id = ?').get(id) as ProjectRow;
  return hydrateProject(row);
}

export function updateProject(idOrRef: string, patch: Partial<ProjectInput>): Project {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM projects WHERE reference = ?').get(idOrRef)) as ProjectRow | undefined;
  if (!existing) throw new Error('Project not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', description: 'description', status: 'status', priority: 'priority', startDate: 'start_date', endDate: 'end_date', budget: 'budget', currency: 'currency', managerId: 'manager_id', customerReference: 'customer_reference' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateProject(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT p.*, m.first_name || \' \' || m.last_name AS manager_name FROM projects p LEFT JOIN employees m ON m.id = p.manager_id WHERE p.id = ?').get(existing.id) as ProjectRow;
  return hydrateProject(updated);
}

export function deleteProject(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM projects WHERE reference = ?').get(idOrRef)) as ProjectRow | undefined;
  if (!row) throw new Error('Project not found');
  db.prepare('DELETE FROM projects WHERE id = ?').run(row.id);
}

// Project Milestones
export function listMilestones(projectRef: string) {
  const rows = db.prepare('SELECT * FROM project_milestones WHERE project_reference = ? ORDER BY due_date, id').all(projectRef) as Array<{ id: number; project_reference: string; title: string; description: string | null; due_date: string | null; status: string; completed_at: string | null; created_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    projectReference: r.project_reference,
    title: r.title,
    description: r.description,
    dueDate: r.due_date,
    status: r.status,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  }));
}

export function createMilestone(input: { projectReference: string; title: string; description?: string | null; dueDate?: string | null; status?: string }) {
  const ts = now();
  const info = db.prepare(`INSERT INTO project_milestones (project_reference, title, description, due_date, status, created_at) VALUES (?,?,?,?,?,?)`)
    .run(input.projectReference, input.title, input.description ?? null, input.dueDate ?? null, input.status ?? 'pending', ts);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(id) as { id: number; project_reference: string; title: string; description: string | null; due_date: string | null; status: string; completed_at: string | null; created_at: string };
  return {
    id: row.id,
    projectReference: row.project_reference,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

// Time Entries
export function listTimeEntries(filters: { employeeReference?: string; projectReference?: string; limit?: number; page?: number } = {}) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.employeeReference) { conds.push('employee_reference = ?'); params.push(filters.employeeReference); }
  if (filters.projectReference) { conds.push('project_reference = ?'); params.push(filters.projectReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM time_entries ${where} ORDER BY date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Array<{ id: number; reference: string; employee_reference: string; project_reference: string | null; task_reference: string | null; date: string; hours: number; description: string | null; billable: number; created_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    employeeReference: r.employee_reference,
    projectReference: r.project_reference,
    taskReference: r.task_reference,
    date: r.date,
    hours: r.hours,
    description: r.description,
    billable: r.billable === 1,
    createdAt: r.created_at,
  }));
}

export function createTimeEntry(input: TimeEntryInput): TimeEntry {
  const ts = now();
  const info = db.prepare(`INSERT INTO time_entries (reference, employee_reference, project_reference, task_reference, date, hours, description, billable, created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.employeeReference, input.projectReference ?? null, input.taskReference ?? null, input.date, input.hours, input.description ?? null, input.billable !== false ? 1 : 0, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TE-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE time_entries SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as { id: number; reference: string; employee_reference: string; project_reference: string | null; task_reference: string | null; date: string; hours: number; description: string | null; billable: number; created_at: string };
  return {
    id: row.id,
    reference: row.reference,
    employeeReference: row.employee_reference,
    projectReference: row.project_reference,
    taskReference: row.task_reference,
    date: row.date,
    hours: row.hours,
    description: row.description,
    billable: row.billable === 1,
    createdAt: row.created_at,
  };
}

export function deleteTimeEntry(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM time_entries WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM time_entries WHERE reference = ?').get(idOrRef)) as { id: number } | undefined;
  if (!row) throw new Error('Time entry not found');
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(row.id);
}

// Attendance
export function listAttendance(filters: { employeeReference?: string; date?: string; limit?: number; page?: number } = {}) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.employeeReference) { conds.push('employee_reference = ?'); params.push(filters.employeeReference); }
  if (filters.date) { conds.push('date = ?'); params.push(filters.date); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM attendance ${where} ORDER BY date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Array<{ id: number; employee_reference: string; date: string; check_in: string | null; check_out: string | null; status: string; hours_worked: number; notes: string | null; created_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    employeeReference: r.employee_reference,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: r.status,
    hoursWorked: r.hours_worked,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export function createAttendance(input: { employeeReference: string; date: string; checkIn?: string | null; checkOut?: string | null; status?: string; hoursWorked?: number; notes?: string | null }) {
  const ts = now();
  const info = db.prepare(`INSERT INTO attendance (employee_reference, date, check_in, check_out, status, hours_worked, notes, created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(input.employeeReference, input.date, input.checkIn ?? null, input.checkOut ?? null, input.status ?? 'present', input.hoursWorked ?? 0, input.notes ?? null, ts);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as { id: number; employee_reference: string; date: string; check_in: string | null; check_out: string | null; status: string; hours_worked: number; notes: string | null; created_at: string };
  return {
    id: row.id,
    employeeReference: row.employee_reference,
    date: row.date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    hoursWorked: row.hours_worked,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// Payroll
export function listPayroll(filters: { employeeReference?: string; status?: string; limit?: number; page?: number } = {}) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.employeeReference) { conds.push('employee_reference = ?'); params.push(filters.employeeReference); }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM payroll ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Array<{ id: number; reference: string; employee_reference: string; period_start: string; period_end: string; base_salary: number; allowances: number; deductions: number; tax: number; net_pay: number; status: string; paid_at: string | null; notes: string | null; created_at: string; updated_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    employeeReference: r.employee_reference,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    baseSalary: r.base_salary,
    allowances: r.allowances,
    deductions: r.deductions,
    tax: r.tax,
    netPay: r.net_pay,
    status: r.status,
    paidAt: r.paid_at,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function createPayroll(input: { employeeReference: string; periodStart: string; periodEnd: string; baseSalary?: number; allowances?: number; deductions?: number; tax?: number; status?: string; notes?: string | null }) {
  const ts = now();
  const baseSalary = input.baseSalary ?? 0;
  const allowances = input.allowances ?? 0;
  const deductions = input.deductions ?? 0;
  const tax = input.tax ?? 0;
  const netPay = baseSalary + allowances - deductions - tax;
  const info = db.prepare(`INSERT INTO payroll (reference, employee_reference, period_start, period_end, base_salary, allowances, deductions, tax, net_pay, status, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.employeeReference, input.periodStart, input.periodEnd, baseSalary, allowances, deductions, tax, netPay, input.status ?? 'draft', input.notes ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `PAYROLL-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE payroll SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM payroll WHERE id = ?').get(id) as { id: number; reference: string; employee_reference: string; period_start: string; period_end: string; base_salary: number; allowances: number; deductions: number; tax: number; net_pay: number; status: string; paid_at: string | null; notes: string | null; created_at: string; updated_at: string };
  return {
    id: row.id,
    reference: row.reference,
    employeeReference: row.employee_reference,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    baseSalary: row.base_salary,
    allowances: row.allowances,
    deductions: row.deductions,
    tax: row.tax,
    netPay: row.net_pay,
    status: row.status,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function updatePayroll(idOrRef: string, patch: { status?: string; paidAt?: string | null; notes?: string | null }) {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM payroll WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM payroll WHERE reference = ?').get(idOrRef)) as { id: number; reference: string } | undefined;
  if (!existing) throw new Error('Payroll not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { status: 'status', paidAt: 'paid_at', notes: 'notes' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return;
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE payroll SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const row = db.prepare('SELECT * FROM payroll WHERE id = ?').get(existing.id) as { id: number; reference: string; employee_reference: string; period_start: string; period_end: string; base_salary: number; allowances: number; deductions: number; tax: number; net_pay: number; status: string; paid_at: string | null; notes: string | null; created_at: string; updated_at: string };
  return {
    id: row.id,
    reference: row.reference,
    employeeReference: row.employee_reference,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    baseSalary: row.base_salary,
    allowances: row.allowances,
    deductions: row.deductions,
    tax: row.tax,
    netPay: row.net_pay,
    status: row.status,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deletePayroll(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM payroll WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM payroll WHERE reference = ?').get(idOrRef)) as { id: number } | undefined;
  if (!row) throw new Error('Payroll not found');
  db.prepare('DELETE FROM payroll WHERE id = ?').run(row.id);
}