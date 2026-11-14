import db from './db';
import type { } from '@/lib/types';

interface Row { id:number; reference:string; name:string; sku:string|null; type:string; price:number; cost:number; stock:number; reorder_point:number; reorder_quantity:number; status:string; description:string|null; created_at:string; updated_at:string; }

function now(){return new Date().toISOString();}
function hydrate(r:Row){return {id:r.id,reference:r.reference,name:r.name,sku:r.sku,type:r.type,price:r.price,cost:r.cost,stock:r.stock,reorderPoint:r.reorder_point,reorderQuantity:r.reorder_quantity,status:r.status,description:r.description,createdAt:r.created_at,updatedAt:r.updated_at};}

export function listProducts(filters:{search?:string;status?:string;limit?:number;page?:number}={}){
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.search){conds.push('(name LIKE ? OR sku LIKE ?)');const q=`%${filters.search}%`;params.push(q,q);}
  if(filters.status){conds.push('status=?');params.push(filters.status);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows=db.prepare(`SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  return rows.map(hydrate);
}
export function createProduct(input: Record<string, unknown>): { reference: string; name: string } {
  const ts=now();
  const info=db.prepare(`INSERT INTO products (reference,name,sku,type,price,cost,stock,reorder_point,reorder_quantity,status,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run('tmp',input.name,input.sku??null,input.type??'service',input.price??0,input.cost??0,input.stock??0,input.reorderPoint??0,input.reorderQuantity??0,input.status??'active',input.description??null,ts,ts);
  const id=Number(info.lastInsertRowid);
  const ref=`PROD-${String(id).padStart(4,'0')}`;
  db.prepare('UPDATE products SET reference=? WHERE id=?').run(ref,id);
  const row=db.prepare('SELECT * FROM products WHERE id=?').get(id) as Row;
  return hydrate(row);
}
export function deleteProduct(idOrRef:string):void{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM products WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM products WHERE reference=?').get(idOrRef)) as Row|undefined;
  if(!row) throw new Error('Product not found');
  db.prepare('DELETE FROM products WHERE id=?').run(row.id);
}

export function updateProduct(idOrRef:string, patch:Record<string,unknown>): Record<string, unknown>{
  const isNum=/^\d+$/.test(idOrRef);
  const existing=(isNum?db.prepare('SELECT * FROM products WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM products WHERE reference=?').get(idOrRef)) as Row|undefined;
  if(!existing) throw new Error('Product not found');
  const fields:string[]=[];const params:Record<string,unknown>={id:existing.id};
  const map:Record<string,string>={name:'name',sku:'sku',type:'type',price:'price',cost:'cost',stock:'stock',reorderPoint:'reorder_point',reorderQuantity:'reorder_quantity',status:'status',description:'description'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=patch[k]??null;}
  }
  if(!fields.length) return hydrate(existing);
  fields.push('updated_at=@updated_at');params.updated_at=now();
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const updated=db.prepare('SELECT * FROM products WHERE id=?').get(existing.id) as Row;
  return hydrate(updated);
}
export function listReorderCandidates(): Array<Record<string, unknown>> {
  const rows = db.prepare(`SELECT * FROM products WHERE reorder_point > 0 AND stock <= reorder_point ORDER BY (reorder_point - stock) DESC`).all() as Row[];
  return rows.map(hydrate);
}
