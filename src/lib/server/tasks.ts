import db from './db';
import type { Task, TaskInput } from '@/lib/types';

interface Row { id:number; reference:string; title:string; description:string|null; related_type:string|null; related_reference:string|null; due_date:string|null; status:string; priority:string; assigned_to:number|null; assigned_to_name:string|null; created_at:string; updated_at:string; }

function now(){return new Date().toISOString();}
function hydrate(r:Row):Task{return{id:r.id,reference:r.reference,title:r.title,description:r.description,relatedType:r.related_type,relatedReference:r.related_reference,dueDate:r.due_date,status:r.status,priority:r.priority,assignedTo:r.assigned_to,assignedToName:r.assigned_to_name,createdAt:r.created_at,updatedAt:r.updated_at};}

export function listTasks(filters:{search?:string;status?:string;priority?:string;assignedTo?:number;limit?:number;page?:number}={}):Task[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.search){conds.push('(t.title LIKE ? OR t.description LIKE ?)');const q=`%${filters.search}%`;params.push(q,q);}
  if(filters.status){conds.push('t.status=?');params.push(filters.status);}
  if(filters.priority){conds.push('t.priority=?');params.push(filters.priority);}
  if(filters.assignedTo){conds.push('t.assigned_to=?');params.push(filters.assignedTo);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows=db.prepare(`SELECT t.*, p.name AS assigned_to_name FROM tasks t LEFT JOIN people p ON p.id=t.assigned_to ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  return rows.map(hydrate);
}
export function createTask(input:TaskInput):Task{
  const ts=now();
  const info=db.prepare(`INSERT INTO tasks (reference,title,description,related_type,related_reference,due_date,status,priority,assigned_to,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run('tmp',input.title,input.description??null,input.relatedType??null,input.relatedReference??null,input.dueDate??null,input.status??'open',input.priority??'medium',input.assignedTo??null,ts,ts);
  const id=Number(info.lastInsertRowid);
  const ref=`TASK-${String(id).padStart(4,'0')}`;
  db.prepare('UPDATE tasks SET reference=? WHERE id=?').run(ref,id);
  const row=db.prepare('SELECT t.*, p.name AS assigned_to_name FROM tasks t LEFT JOIN people p ON p.id=t.assigned_to WHERE t.id=?').get(id) as Row;
  return hydrate(row);
}
export function updateTask(idOrRef:string,patch:Partial<TaskInput>):Task{
  const isNum=/^\d+$/.test(idOrRef);
  const existing=(isNum?db.prepare('SELECT * FROM tasks WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM tasks WHERE reference=?').get(idOrRef)) as Row | undefined;
  if(!existing) throw new Error('Task not found');
  const id=existing.id;
  const fields:string[]=[];const params:Record<string,unknown>={id};
  const map:Record<string,string>={title:'title',description:'description',relatedType:'related_type',relatedReference:'related_reference',dueDate:'due_date',status:'status',priority:'priority',assignedTo:'assigned_to'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=(patch as Record<string,unknown>)[k]??null;}
  }
  fields.push('updated_at=@updated_at');params.updated_at=now();
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const row=db.prepare('SELECT t.*, p.name AS assigned_to_name FROM tasks t LEFT JOIN people p ON p.id=t.assigned_to WHERE t.id=?').get(id) as Row;
  return hydrate(row);
}
export function deleteTask(idOrRef:string):void{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM tasks WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM tasks WHERE reference=?').get(idOrRef)) as Row | undefined;
  if(!row) throw new Error('Task not found');
  db.prepare('DELETE FROM tasks WHERE id=?').run(row.id);
}
