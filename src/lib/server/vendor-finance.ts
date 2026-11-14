import db from './db';
import type { VendorContract, VendorContractInput, VendorPayout, VendorPayoutInput, VendorInvoice, VendorInvoiceInput, VendorInvoiceLine, VendorInvoiceLineInput, VendorInvoicePayment, VendorInvoicePaymentInput, VendorCreditNote, VendorCreditNoteInput } from '@/lib/types';
import { getPurchaseOrderByIdOrRef, getPOReceivingStatus } from './procurement';

interface VCRow { id:number; reference:string; vendor_reference:string; name:string; kind:string; url:string|null; verified:number; verified_by:string|null; verified_at:string|null; uploaded_by:string|null; created_at:string; expires_at:string|null; }
interface VPRow { id:number; reference:string; vendor_reference:string; sourcing_request_reference:string|null; deliverable:string; amount:number; trigger_type:string; status:string; released:number; released_at:string|null; released_by:string|null; notes:string|null; created_at:string; updated_at:string; }
interface VIRow { id:number; reference:string; vendor_reference:string; sourcing_request_reference:string|null; purchase_order_reference:string|null; goods_receipt_reference:string|null; status:string; currency:string; subtotal:number; discount_amount:number; tax_percent:number; tax_amount:number; total:number; issue_date:string|null; due_date:string|null; issued_at:string|null; paid_at:string|null; voided_at:string|null; notes:string|null; created_by:string; match_status:string; matched_amount:number; exception_reason:string|null; created_at:string; updated_at:string; }
interface VILRow { id:number; vendor_invoice_reference:string; sequence:number; description:string|null; amount:number; currency:string; created_at:string; }
interface VIPRow { id:number; vendor_invoice_reference:string; amount:number; method:string|null; reference:string|null; note:string|null; paid_at:string; recorded_by:string; created_at:string; }
interface VCNRow { id:number; vendor_invoice_reference:string; amount:number; reason:string|null; refunded_at:string; recorded_by:string; created_at:string; }

function now(){return new Date().toISOString();}
function nextRef(table:string,prefix:string){const info=db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as {c:number};return `${prefix}-${String(info.c+1).padStart(4,'0')}`;}

function hydrateVC(r:VCRow):VendorContract{
  const vendor=db.prepare('SELECT name FROM vendors WHERE reference=?').get(r.vendor_reference) as {name:string}|undefined;
  return {id:r.id,reference:r.reference,vendorReference:r.vendor_reference,vendorName:vendor?.name??null,name:r.name,kind:r.kind,url:r.url,verified:r.verified===1,verifiedBy:r.verified_by,verifiedAt:r.verified_at,uploadedBy:r.uploaded_by,createdAt:r.created_at,expiresAt:r.expires_at};
}
function hydrateVP(r:VPRow):VendorPayout{
  const vendor=db.prepare('SELECT name FROM vendors WHERE reference=?').get(r.vendor_reference) as {name:string}|undefined;
  return {id:r.id,reference:r.reference,vendorReference:r.vendor_reference,vendorName:vendor?.name??null,sourcingRequestReference:r.sourcing_request_reference,deliverable:r.deliverable,amount:r.amount,triggerType:r.trigger_type,status:r.status,released:r.released===1,releasedAt:r.released_at,releasedBy:r.released_by,notes:r.notes,createdAt:r.created_at,updatedAt:r.updated_at};
}
function hydrateVI(r:VIRow):VendorInvoice{
  const vendor=db.prepare('SELECT name FROM vendors WHERE reference=?').get(r.vendor_reference) as {name:string}|undefined;
  const lines=db.prepare('SELECT * FROM vendor_invoice_lines WHERE vendor_invoice_reference=? ORDER BY sequence').all(r.reference) as VILRow[];
  const payments=db.prepare('SELECT * FROM vendor_invoice_payments WHERE vendor_invoice_reference=? ORDER BY paid_at').all(r.reference) as VIPRow[];
  const credits=db.prepare('SELECT * FROM vendor_credit_notes WHERE vendor_invoice_reference=? ORDER BY refunded_at').all(r.reference) as VCNRow[];
  return {id:r.id,reference:r.reference,vendorReference:r.vendor_reference,vendorName:vendor?.name??null,sourcingRequestReference:r.sourcing_request_reference,purchaseOrderReference:r.purchase_order_reference,goodsReceiptReference:r.goods_receipt_reference,status:r.status,currency:r.currency,subtotal:r.subtotal,discountAmount:r.discount_amount,taxPercent:r.tax_percent,taxAmount:r.tax_amount,total:r.total,issueDate:r.issue_date,dueDate:r.due_date,issuedAt:r.issued_at,paidAt:r.paid_at,voidedAt:r.voided_at,notes:r.notes,createdBy:r.created_by,matchStatus:r.match_status as 'pending' | 'partial' | 'matched' | 'exception',matchedAmount:r.matched_amount,exceptionReason:r.exception_reason,lines:lines.map((l)=>({id:l.id,vendorInvoiceReference:l.vendor_invoice_reference,sequence:l.sequence,description:l.description,amount:l.amount,currency:l.currency,createdAt:l.created_at})),payments:payments.map((p)=>({id:p.id,vendorInvoiceReference:p.vendor_invoice_reference,amount:p.amount,method:p.method,reference:p.reference,note:p.note,paidAt:p.paid_at,recordedBy:p.recorded_by,createdAt:p.created_at})),creditNotes:credits.map((c)=>({id:c.id,vendorInvoiceReference:c.vendor_invoice_reference,amount:c.amount,reason:c.reason,refundedAt:c.refunded_at,recordedBy:c.recorded_by,createdAt:c.created_at})),createdAt:r.created_at,updatedAt:r.updated_at};
}

// ---------- Vendor Contracts ----------
export function listVendorContracts(filters:{vendorReference?:string;limit?:number;page?:number}={}):VendorContract[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.vendorReference){conds.push('vendor_reference=?');params.push(filters.vendorReference);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page=filters.page&&filters.page>0?filters.page:1;
  const limit=filters.limit?Number(filters.limit):20;
  const offset=(page-1)*limit;
  const rows=db.prepare(`SELECT * FROM vendor_contracts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params,limit,offset) as VCRow[];
  return rows.map(hydrateVC);
}
export function createVendorContract(input:VendorContractInput):VendorContract{
  const ts=now();
  const ref=nextRef('vendor_contracts','VC');
  db.prepare(`INSERT INTO vendor_contracts (reference,vendor_reference,name,kind,url,verified,verified_by,verified_at,uploaded_by,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ref,input.vendorReference,input.name,input.kind??'contract',input.url??null,0,null,null,input.uploadedBy??'admin',ts,input.expiresAt??null);
  const row=db.prepare('SELECT * FROM vendor_contracts WHERE reference=?').get(ref) as VCRow;
  return hydrateVC(row);
}
export function verifyVendorContract(reference:string,verifiedBy:string):VendorContract{
  const ts=now();
  db.prepare('UPDATE vendor_contracts SET verified=1,verified_by=?,verified_at=? WHERE reference=?').run(verifiedBy,ts,reference);
  const row=db.prepare('SELECT * FROM vendor_contracts WHERE reference=?').get(reference) as VCRow;
  return hydrateVC(row);
}

// ---------- Vendor Payouts ----------
export function listVendorPayouts(filters:{vendorReference?:string;status?:string;released?:boolean;limit?:number;page?:number}={}):VendorPayout[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.vendorReference){conds.push('vendor_reference=?');params.push(filters.vendorReference);}
  if(filters.status){conds.push('status=?');params.push(filters.status);}
  if(filters.released!==undefined){conds.push('released=?');params.push(filters.released?1:0);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page=filters.page&&filters.page>0?filters.page:1;
  const limit=filters.limit?Number(filters.limit):20;
  const offset=(page-1)*limit;
  const rows=db.prepare(`SELECT * FROM vendor_payouts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params,limit,offset) as VPRow[];
  return rows.map(hydrateVP);
}
export function createVendorPayout(input:VendorPayoutInput):VendorPayout{
  const ts=now();
  const ref=nextRef('vendor_payouts','VP');
  db.prepare(`INSERT INTO vendor_payouts (reference,vendor_reference,sourcing_request_reference,deliverable,amount,trigger_type,status,released,released_at,released_by,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ref,input.vendorReference,input.sourcingRequestReference??null,input.deliverable,input.amount,input.triggerType??'client_approval',input.status??'pending',0,null,null,input.notes??null,ts,ts);
  const row=db.prepare('SELECT * FROM vendor_payouts WHERE reference=?').get(ref) as VPRow;
  return hydrateVP(row);
}
export function releaseVendorPayout(reference:string,releasedBy:string):VendorPayout{
  const ts=now();
  db.prepare('UPDATE vendor_payouts SET released=1,released_at=?,released_by=?,status=?,updated_at=? WHERE reference=?').run(ts,releasedBy,'released',ts,reference);
  const row=db.prepare('SELECT * FROM vendor_payouts WHERE reference=?').get(reference) as VPRow;
  return hydrateVP(row);
}
export function updateVendorPayoutStatus(reference:string,status:string):VendorPayout{
  const ts=now();
  db.prepare('UPDATE vendor_payouts SET status=?,updated_at=? WHERE reference=?').run(status,ts,reference);
  const row=db.prepare('SELECT * FROM vendor_payouts WHERE reference=?').get(reference) as VPRow;
  return hydrateVP(row);
}

// ---------- Vendor Invoices ----------
export function listVendorInvoices(filters:{vendorReference?:string;status?:string;limit?:number;page?:number}={}):VendorInvoice[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.vendorReference){conds.push('vendor_reference=?');params.push(filters.vendorReference);}
  if(filters.status){conds.push('status=?');params.push(filters.status);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page=filters.page&&filters.page>0?filters.page:1;
  const limit=filters.limit?Number(filters.limit):20;
  const offset=(page-1)*limit;
  const rows=db.prepare(`SELECT * FROM vendor_invoices ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params,limit,offset) as VIRow[];
  return rows.map(hydrateVI);
}
export function getVendorInvoiceByIdOrRef(idOrRef:string):VendorInvoice|null{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM vendor_invoices WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM vendor_invoices WHERE reference=?').get(idOrRef)) as VIRow|undefined;
  if(!row) return null;
  return hydrateVI(row);
}
export function createVendorInvoice(input:VendorInvoiceInput):VendorInvoice{
  const ts=now();
  const ref=nextRef('vendor_invoices','VIN');
  const subtotal=input.lines.reduce((s,l)=>s+l.amount,0);
  const discount=input.discountAmount??0;
  const taxable=subtotal-discount;
  const taxPercent=input.taxPercent??0;
  const taxAmount=Math.round(taxable*taxPercent/100*100)/100;
  const total=taxable+taxAmount;
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO vendor_invoices (reference,vendor_reference,sourcing_request_reference,purchase_order_reference,goods_receipt_reference,status,currency,subtotal,discount_amount,tax_percent,tax_amount,total,issue_date,due_date,issued_at,paid_at,voided_at,notes,created_by,match_status,matched_amount,exception_reason,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(ref,input.vendorReference,input.sourcingRequestReference??null,input.purchaseOrderReference??null,input.goodsReceiptReference??null,'draft',input.currency??'USD',subtotal,discount,taxPercent,taxAmount,total,input.issueDate??ts.slice(0,10),input.dueDate??null,null,null,null,input.notes??null,'admin','pending',0,null,ts,ts);
    input.lines.forEach((l,idx)=>{
      db.prepare(`INSERT INTO vendor_invoice_lines (vendor_invoice_reference,sequence,description,amount,currency,created_at) VALUES (?,?,?,?,?,?)`).run(ref,idx+1,l.description??null,l.amount,l.currency??input.currency??'USD',ts);
    });
  });
  tx();
  const inv=getVendorInvoiceByIdOrRef(ref);
  if(!inv) throw new Error('Failed');
  return inv;
}
export function issueVendorInvoice(reference:string):VendorInvoice{
  const ts=now();
  db.prepare('UPDATE vendor_invoices SET status=?,issued_at=?,updated_at=? WHERE reference=?').run('issued',ts,ts,reference);
  const inv=getVendorInvoiceByIdOrRef(reference);
  if(!inv) throw new Error('Not found');
  return inv;
}

// 3-Way Matching: Vendor Invoice <-> Purchase Order <-> Goods Receipt
export function matchVendorInvoice(viReference: string): { matched: boolean; matchedAmount: number; status: string; reason?: string } {
  const inv = getVendorInvoiceByIdOrRef(viReference);
  if (!inv) throw new Error('Vendor invoice not found');
  if (!inv.purchaseOrderReference) {
    return { matched: false, matchedAmount: 0, status: 'exception', reason: 'No purchase order linked' };
  }
  const po = getPurchaseOrderByIdOrRef(inv.purchaseOrderReference);
  if (!po) return { matched: false, matchedAmount: 0, status: 'exception', reason: 'Purchase order not found' };
  const receiving = getPOReceivingStatus(inv.purchaseOrderReference);
  if (!receiving || receiving.items.length === 0) {
    return { matched: false, matchedAmount: 0, status: 'exception', reason: 'No goods receipt found' };
  }
  const grItems = receiving.items;
  // Calculate matched amount based on GR lines
  let matchedAmount = 0;
  for (const invLine of inv.lines) {
    const grItem = grItems.find(i => i.description === invLine.description);
    if (grItem) {
      // Use the full line amount if fully received, otherwise proportionally
      const receivedRatio = grItem.received / grItem.ordered;
      matchedAmount += invLine.amount * Math.min(1, receivedRatio);
    } else {
      matchedAmount += invLine.amount;
    }
  }
  const fullyMatched = Math.abs(matchedAmount - inv.total) < 0.01;
  const ts = now();
  if (fullyMatched) {
    db.prepare('UPDATE vendor_invoices SET match_status=?, matched_amount=?, match_status=?, updated_at=? WHERE reference=?').run('matched', matchedAmount, 'matched', ts, viReference);
    return { matched: true, matchedAmount, status: 'matched' };
  } else {
    db.prepare('UPDATE vendor_invoices SET match_status=?, matched_amount=?, match_status=?, updated_at=? WHERE reference=?').run('partial', matchedAmount, 'partial', ts, viReference);
    return { matched: false, matchedAmount, status: 'partial', reason: 'Partial match - amounts differ' };
  }
}

// Auto-match all pending vendor invoices
export function autoMatchVendorInvoices(): { processed: number; matched: number; exceptions: number } {
  const invoices = db.prepare("SELECT reference FROM vendor_invoices WHERE match_status = 'pending' AND purchase_order_reference IS NOT NULL").all() as {reference: string}[];
  let matched = 0, exceptions = 0;
  for (const inv of invoices) {
    const result = matchVendorInvoice(inv.reference);
    if (result.status === 'matched') matched++;
    else if (result.status === 'exception') exceptions++;
  }
  return { processed: invoices.length, matched, exceptions };
}

export function voidVendorInvoice(reference:string):VendorInvoice{
  const ts=now();
  db.prepare('UPDATE vendor_invoices SET status=?,voided_at=?,updated_at=? WHERE reference=?').run('void',ts,ts,reference);
  const inv=getVendorInvoiceByIdOrRef(reference);
  if(!inv) throw new Error('Not found');
  return inv;
}
export function recordVendorInvoicePayment(input:VendorInvoicePaymentInput):VendorInvoicePayment{
  const ts=now();
  const paidAt=input.paidAt??ts.slice(0,10);
  db.prepare(`INSERT INTO vendor_invoice_payments (vendor_invoice_reference,amount,method,reference,note,paid_at,recorded_by,created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(input.vendorInvoiceReference,input.amount,input.method??null,input.reference??null,input.note??null,paidAt,input.recordedBy??'admin',ts);
  // Update invoice status
  const inv=getVendorInvoiceByIdOrRef(input.vendorInvoiceReference);
  if(inv){
    const paid=inv.payments.reduce((s,p)=>s+p.amount,0)+input.amount;
    let newStatus=inv.status;
    if(paid>=inv.total-0.01) newStatus='paid';
    else if(paid>0) newStatus='partially_paid';
    if(newStatus!==inv.status){
      db.prepare('UPDATE vendor_invoices SET status=?,paid_at=?,updated_at=? WHERE reference=?').run(newStatus,paid>=inv.total-0.01?ts:null,ts,input.vendorInvoiceReference);
    }
  }
  const row=db.prepare('SELECT * FROM vendor_invoice_payments WHERE vendor_invoice_reference=? ORDER BY id DESC LIMIT 1').get(input.vendorInvoiceReference) as VIPRow;
  return {id:row.id,vendorInvoiceReference:row.vendor_invoice_reference,amount:row.amount,method:row.method,reference:row.reference,note:row.note,paidAt:row.paid_at,recordedBy:row.recorded_by,createdAt:row.created_at};
}
export function recordVendorCreditNote(input:VendorCreditNoteInput):VendorCreditNote{
  const ts=now();
  const refundedAt=input.refundedAt??ts.slice(0,10);
  db.prepare(`INSERT INTO vendor_credit_notes (vendor_invoice_reference,amount,reason,refunded_at,recorded_by,created_at) VALUES (?,?,?,?,?,?)`)
    .run(input.vendorInvoiceReference,input.amount,input.reason??null,refundedAt,input.recordedBy??'admin',ts);
  // Update invoice status
  const inv=getVendorInvoiceByIdOrRef(input.vendorInvoiceReference);
  if(inv){
    const paid=inv.payments.reduce((s,p)=>s+p.amount,0);
    const credited=inv.creditNotes.reduce((s,c)=>s+c.amount,0)+input.amount;
    const net=paid-credited;
    let newStatus=inv.status;
    if(net<=0) newStatus='refunded';
    else if(net<inv.total-0.01) newStatus='partially_paid';
    if(newStatus!==inv.status){
      db.prepare('UPDATE vendor_invoices SET status=?,updated_at=? WHERE reference=?').run(newStatus,ts,input.vendorInvoiceReference);
    }
  }
  const row=db.prepare('SELECT * FROM vendor_credit_notes WHERE vendor_invoice_reference=? ORDER BY id DESC LIMIT 1').get(input.vendorInvoiceReference) as VCNRow;
  return {id:row.id,vendorInvoiceReference:row.vendor_invoice_reference,amount:row.amount,reason:row.reason,refundedAt:row.refunded_at,recordedBy:row.recorded_by,createdAt:row.created_at};
}
