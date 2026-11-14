import db from './db';
import type { Expense, ExpenseInput } from '@/lib/types';

interface Row { 
  id:number; 
  reference:string; 
  title:string; 
  category:string; 
  amount:number; 
  currency:string; 
  status:string; 
  expense_date:string; 
  paid_by:string|null; 
  notes:string|null; 
  receipt_url:string|null; 
  vendor_reference:string|null;
  asset_reference:string|null;
  purchase_order_reference:string|null;
  asset_category:string|null;
  is_asset_purchase:number;
  asset_depreciation_reference:string|null;
  created_at:string; 
  updated_at:string; 
}

function now(){return new Date().toISOString();}
function hydrate(r:Row):Expense{return{
  id:r.id,
  reference:r.reference,
  title:r.title,
  category:r.category,
  amount:r.amount,
  currency:r.currency,
  status:r.status,
  expenseDate:r.expense_date,
  paidBy:r.paid_by,
  notes:r.notes,
  receiptUrl:r.receipt_url,
  vendorReference:r.vendor_reference,
  assetReference:r.asset_reference,
  purchaseOrderReference:r.purchase_order_reference,
  assetCategory:r.asset_category,
  isAssetPurchase:r.is_asset_purchase === 1,
  assetDepreciationReference:r.asset_depreciation_reference,
  createdAt:r.created_at,
  updatedAt:r.updated_at
};}

export function listExpenses(filters:{search?:string;status?:string;category?:string;limit?:number;page?:number}={}):Expense[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.search){conds.push('(title LIKE ? OR category LIKE ?)');const q=`%${filters.search}%`;params.push(q,q);}
  if(filters.status){conds.push('status=?');params.push(filters.status);}
  if(filters.category){conds.push('category=?');params.push(filters.category);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows=db.prepare(`SELECT * FROM expenses ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  return rows.map(hydrate);
}
export function createExpense(input:ExpenseInput):Expense{
  const ts=now();
  const info=db.prepare(`INSERT INTO expenses (reference,title,category,amount,currency,status,expense_date,paid_by,notes,receipt_url,vendor_reference,asset_reference,purchase_order_reference,asset_category,is_asset_purchase,asset_depreciation_reference,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('tmp',input.title,input.category??'general',input.amount,input.currency??'USD',input.status??'pending',input.expenseDate??ts.slice(0,10),input.paidBy??null,input.notes??null,input.receiptUrl??null,input.vendorReference??null,input.assetReference??null,input.purchaseOrderReference??null,input.assetCategory??null,input.isAssetPurchase?1:0,input.assetDepreciationReference??null,ts,ts);
  const id=Number(info.lastInsertRowid);
  const ref=`EXP-${String(id).padStart(4,'0')}`;
  db.prepare('UPDATE expenses SET reference=? WHERE id=?').run(ref,id);
  const row=db.prepare('SELECT * FROM expenses WHERE id=?').get(id) as Row;
  return hydrate(row);
}
export function updateExpense(idOrRef:string,patch:Partial<ExpenseInput>):Expense{
  const isNum=/^\d+$/.test(idOrRef);
  const existing=(isNum?db.prepare('SELECT * FROM expenses WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM expenses WHERE reference=?').get(idOrRef)) as Row|undefined;
  if(!existing) throw new Error('Expense not found');
  const fields:string[]=[];const params:Record<string,unknown>={id:existing.id};
  const map:Record<string,string>={title:'title',category:'category',amount:'amount',currency:'currency',status:'status',expenseDate:'expense_date',paidBy:'paid_by',notes:'notes',receiptUrl:'receipt_url',vendorReference:'vendor_reference',assetReference:'asset_reference',purchaseOrderReference:'purchase_order_reference',assetCategory:'asset_category',isAssetPurchase:'is_asset_purchase',assetDepreciationReference:'asset_depreciation_reference'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=(patch as Record<string,unknown>)[k]??null;}
  }
  if(!fields.length) return hydrate(existing);
  fields.push('updated_at=@updated_at');params.updated_at=now();
  db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const updated=db.prepare('SELECT * FROM expenses WHERE id=?').get(existing.id) as Row;
  return hydrate(updated);
}
export function deleteExpense(idOrRef:string):void{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM expenses WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM expenses WHERE reference=?').get(idOrRef)) as Row|undefined;
  if(!row) throw new Error('Expense not found');
  db.prepare('DELETE FROM expenses WHERE id=?').run(row.id);
}
