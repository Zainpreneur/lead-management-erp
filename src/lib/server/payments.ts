import db from './db';
import type { Payment, PaymentInput } from '@/lib/types';

interface Row { id:number; reference:string; invoice_reference:string; customer_reference:string|null; amount:number; method:string; status:string; paid_at:string|null; notes:string|null; created_at:string; }

function now(){return new Date().toISOString();}
function hydrate(r:Row):Payment{return{id:r.id,reference:r.reference,invoiceReference:r.invoice_reference,customerReference:r.customer_reference,amount:r.amount,method:r.method,status:r.status,paidAt:r.paid_at,notes:r.notes,createdAt:r.created_at};}

export function listPayments(filters:{search?:string;status?:string;invoiceReference?:string;limit?:number;page?:number}={}):Payment[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.search){conds.push('(p.reference LIKE ? OR p.invoice_reference LIKE ?)');const q=`%${filters.search}%`;params.push(q,q);}
  if(filters.status){conds.push('p.status=?');params.push(filters.status);}
  if(filters.invoiceReference){conds.push('p.invoice_reference=?');params.push(filters.invoiceReference);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows=db.prepare(`SELECT * FROM payments p ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  return rows.map(hydrate);
}
export function createPayment(input:PaymentInput):Payment{
  const ts=now();
  const info=db.prepare(`INSERT INTO payments (reference,invoice_reference,customer_reference,amount,method,status,paid_at,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)`).run('tmp',input.invoiceReference,null,input.amount,input.method??'cash',input.status??'completed',input.paidAt??ts,input.notes??null,ts);
  const id=Number(info.lastInsertRowid);
  const ref=`PAY-${String(id).padStart(4,'0')}`;
  db.prepare('UPDATE payments SET reference=? WHERE id=?').run(ref,id);
  // update invoice paid_date if completed
  if((input.status??'completed')==='completed'){
    db.prepare("UPDATE invoices SET paid_date=COALESCE(paid_date,?) WHERE reference=?").run(ts.slice(0,10),input.invoiceReference);
    const inv = db.prepare('SELECT total_amount FROM invoices WHERE reference=?').get(input.invoiceReference) as { total_amount:number } | undefined;
    const paid = (db.prepare("SELECT COALESCE(SUM(amount),0) v FROM payments WHERE invoice_reference=? AND status='completed'").get(input.invoiceReference) as { v:number }).v;
    if (inv && paid >= inv.total_amount) {
      db.prepare("UPDATE invoices SET status='paid' WHERE reference=?").run(input.invoiceReference);
    }
  }
  const row=db.prepare('SELECT * FROM payments WHERE id=?').get(id) as Row;
  return hydrate(row);
}

export function updatePayment(idOrRef:string, patch: Partial<PaymentInput>): Payment {
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM payments WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM payments WHERE reference=?').get(idOrRef)) as Row|undefined;
  if(!row) throw new Error('Payment not found');
  const fields:string[]=[];const params:Record<string,unknown>={id:row.id};
  const map:Record<string,string>={amount:'amount',method:'method',status:'status',paidAt:'paid_at',notes:'notes'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=(patch as Record<string,unknown>)[k]??null;}
  }
  if(!fields.length) return hydrate(row);
  db.prepare(`UPDATE payments SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const updated=db.prepare('SELECT * FROM payments WHERE id=?').get(row.id) as Row;
  return hydrate(updated);
}

export function deletePayment(idOrRef:string):void{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM payments WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM payments WHERE reference=?').get(idOrRef)) as Row|undefined;
  if(!row) throw new Error('Payment not found');
  db.prepare('DELETE FROM payments WHERE id=?').run(row.id);
}
