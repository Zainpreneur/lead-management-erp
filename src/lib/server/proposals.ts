import db from './db';
import type { Proposal, ProposalInput, ProposalLine } from '@/lib/types';

interface PRow { id:number; reference:string; lead_reference:string|null; customer_reference:string|null; title:string; status:string; subtotal:number; discount_type:string|null; discount_value:number; total:number; currency:string; valid_until:string|null; notes:string|null; created_at:string; updated_at:string; }
interface LRow { id:number; proposal_reference:string; product_reference:string|null; description:string; quantity:number; unit_price:number; line_total:number; sort_order:number; }

function now(){return new Date().toISOString();}
function hydrateLine(r:LRow):ProposalLine{return{id:r.id,proposalReference:r.proposal_reference,productReference:r.product_reference,description:r.description,quantity:r.quantity,unitPrice:r.unit_price,lineTotal:r.line_total,sortOrder:r.sort_order};}
function hydrate(r:PRow):Proposal{return{id:r.id,reference:r.reference,leadReference:r.lead_reference,customerReference:r.customer_reference,title:r.title,status:r.status,subtotal:r.subtotal,discountType:r.discount_type,discountValue:r.discount_value,total:r.total,currency:r.currency,validUntil:r.valid_until,notes:r.notes,lines:db.prepare('SELECT * FROM proposal_lines WHERE proposal_reference=? ORDER BY sort_order,id').all(r.reference).map((x)=>hydrateLine(x as LRow)),createdAt:r.created_at,updatedAt:r.updated_at};}

export function listProposals(filters:{search?:string;status?:string;leadReference?:string;limit?:number;page?:number}={}):Proposal[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.search){conds.push('(p.reference LIKE ? OR p.title LIKE ?)');const q=`%${filters.search}%`;params.push(q,q);}
  if(filters.status){conds.push('p.status=?');params.push(filters.status);}
  if(filters.leadReference){conds.push('p.lead_reference=?');params.push(filters.leadReference);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows=db.prepare(`SELECT * FROM proposals p ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as PRow[];
  return rows.map(hydrate);
}
export function getProposalByIdOrRef(idOrRef:string):Proposal|null{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM proposals WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM proposals WHERE reference=?').get(idOrRef)) as PRow|undefined;
  if(!row) return null;
  return hydrate(row);
}
export function createProposal(input:ProposalInput):Proposal{
  const ts=now();
  const lines=input.lines??[];
  const subtotal=input.subtotal??lines.reduce((s,l)=>s+(l.quantity??1)*(l.unitPrice??0),0);
  const total=input.total??subtotal;
  const tx=db.transaction(()=>{
    const info=db.prepare(`INSERT INTO proposals (reference,lead_reference,customer_reference,title,status,subtotal,discount_type,discount_value,total,currency,valid_until,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('tmp',input.leadReference??null,input.customerReference??null,input.title,input.status??'draft',subtotal,input.discountType??null,input.discountValue??0,total,input.currency??'USD',input.validUntil??null,input.notes??null,ts,ts);
    const id=Number(info.lastInsertRowid);
    const ref=`PROP-${String(id).padStart(4,'0')}`;
    db.prepare('UPDATE proposals SET reference=? WHERE id=?').run(ref,id);
    lines.forEach((l,idx)=>{
      const qty=l.quantity??1;const price=l.unitPrice??0;
      db.prepare('INSERT INTO proposal_lines (proposal_reference,product_reference,description,quantity,unit_price,line_total,sort_order) VALUES (?,?,?,?,?,?,?)').run(ref,(l as Record<string,unknown>).productReference??null,l.description,qty,price,qty*price,idx);
    });
    return id;
  });
  const id=tx();
  const p=getProposalByIdOrRef(String(id));
  if(!p) throw new Error('Failed to create proposal');
  return p;
}

export function updateProposal(idOrRef:string, patch: Partial<ProposalInput>): Proposal {
  const existing=getProposalByIdOrRef(idOrRef);
  if(!existing) throw new Error('Proposal not found');
  const fields:string[]=[];const params:Record<string,unknown>={id:existing.id};
  const map:Record<string,string>={title:'title',status:'status',subtotal:'subtotal',discountType:'discount_type',discountValue:'discount_value',total:'total',currency:'currency',validUntil:'valid_until',notes:'notes'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=(patch as Record<string,unknown>)[k]??null;}
  }
  if(Object.prototype.hasOwnProperty.call(patch,'leadReference')){fields.push('lead_reference=@lead_reference');params.lead_reference=patch.leadReference??null;}
  if(Object.prototype.hasOwnProperty.call(patch,'customerReference')){fields.push('customer_reference=@customer_reference');params.customer_reference=patch.customerReference??null;}
  if(!fields.length) return existing;
  fields.push('updated_at=@updated_at');params.updated_at=now();
  db.prepare(`UPDATE proposals SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const updated=getProposalByIdOrRef(String(existing.id));
  if(!updated) throw new Error('Failed to update proposal');
  return updated;
}

export function deleteProposal(idOrRef:string):void{
  const existing=getProposalByIdOrRef(idOrRef);
  if(!existing) throw new Error('Proposal not found');
  db.prepare('DELETE FROM proposals WHERE id=?').run(existing.id);
}
