import db from './db';

export function logAudit(entityType:string, entityRef:string, action:string, details?:string, actor:string='system'):void{
  const ts=new Date().toISOString();
  db.prepare('INSERT INTO audit_logs (entity_type, entity_reference, action, actor, details, created_at) VALUES (?,?,?,?,?,?)').run(entityType,entityRef,action,actor,details??null,ts);
}
export function listAuditLogs(filters:{entityType?:string;limit?:number}={}){
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.entityType){conds.push('entity_type=?');params.push(filters.entityType);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const limit=filters.limit?`LIMIT ${Number(filters.limit)}`:'';
  const rows=db.prepare(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC ${limit}`).all(...params) as Array<{id:number;entity_type:string;entity_reference:string;action:string;actor:string;details:string|null;created_at:string}>;
  return rows.map((r)=>({id:r.id,entityType:r.entity_type,entityReference:r.entity_reference,action:r.action,actor:r.actor,details:r.details,createdAt:r.created_at}));
}
