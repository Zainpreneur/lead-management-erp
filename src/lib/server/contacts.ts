import db from './db';

interface Row { id:number; reference:string; customer_reference:string|null; account_name:string|null; name:string; role:string|null; email:string|null; phone:string|null; is_primary:number; created_at:string; updated_at:string; }

function now(){return new Date().toISOString();}
function hydrate(r:Row){return {id:r.id,reference:r.reference,customerReference:r.customer_reference,accountName:r.account_name,name:r.name,role:r.role,email:r.email,phone:r.phone,isPrimary:r.is_primary===1,createdAt:r.created_at,updatedAt:r.updated_at};}

export function listContacts(filters:{search?:string;customerReference?:string;limit?:number}={}){
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.search){conds.push('(name LIKE ? OR email LIKE ?)');const q=`%${filters.search}%`;params.push(q,q);}
  if(filters.customerReference){conds.push('customer_reference=?');params.push(filters.customerReference);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const limit=filters.limit?`LIMIT ${Number(filters.limit)}`:'';
  const rows=db.prepare(`SELECT * FROM contacts ${where} ORDER BY created_at DESC ${limit}`).all(...params) as Row[];
  return rows.map(hydrate);
}
export function createContact(input: Record<string, unknown>): { reference: string; name: string } {
  const ts=now();
  const info=db.prepare(`INSERT INTO contacts (reference,customer_reference,account_name,name,role,email,phone,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).run('tmp',input.customerReference??null,input.accountName??null,input.name,input.role??null,input.email??null,input.phone??null,input.isPrimary?1:0,ts,ts);
  const id=Number(info.lastInsertRowid);
  const ref=`CONT-${String(id).padStart(4,'0')}`;
  db.prepare('UPDATE contacts SET reference=? WHERE id=?').run(ref,id);
  const row=db.prepare('SELECT * FROM contacts WHERE id=?').get(id) as Row;
  return hydrate(row);
}
export function deleteContact(idOrRef:string):void{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM contacts WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM contacts WHERE reference=?').get(idOrRef)) as Row | undefined;
  if(!row) throw new Error('Contact not found');
  db.prepare('DELETE FROM contacts WHERE id=?').run(row.id);
}

export function updateContact(idOrRef:string, patch:Record<string,unknown>): Record<string, unknown>{
  const isNum=/^\d+$/.test(idOrRef);
  const existing=(isNum?db.prepare('SELECT * FROM contacts WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM contacts WHERE reference=?').get(idOrRef)) as Row | undefined;
  if(!existing) throw new Error('Contact not found');
  const fields:string[]=[];const params:Record<string,unknown>={id:existing.id};
  const map:Record<string,string>={customerReference:'customer_reference',accountName:'account_name',name:'name',role:'role',email:'email',phone:'phone',isPrimary:'is_primary'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=patch[k]??null;}
  }
  if(!fields.length) return hydrate(existing);
  fields.push('updated_at=@updated_at');params.updated_at=now();
  db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const updated=db.prepare('SELECT * FROM contacts WHERE id=?').get(existing.id) as Row;
  return hydrate(updated);
}