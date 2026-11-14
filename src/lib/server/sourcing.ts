import db from './db';
import type { SourcingRequest, SourcingRequestInput, SourcingLine, SourcingInvite, VendorQuote, VendorQuoteInput, VendorQuoteLine } from '@/lib/types';

interface SRRow { id:number; reference:string; title:string; status:string; round:number; whole_deliverable:number; anonymous:number; currency:string; due_date:string|null; budget:number|null; notes:string|null; created_by:string; created_at:string; updated_at:string; }
interface SLRow { id:number; sourcing_request_id:number; sequence:number; title:string; description:string|null; quantity:number; unit:string; awarded_vendor_reference:string|null; awarded_at:string|null; created_at:string; }
interface SIRow { id:number; sourcing_request_id:number; vendor_reference:string; round:number; status:string; created_at:string; }
interface VQRow { id:number; reference:string; sourcing_request_id:number; vendor_reference:string; round:number; status:string; total:number; notes:string|null; submitted_at:string|null; created_at:string; updated_at:string; }
interface VQLRow { id:number; quote_reference:string; line_id:number; unit_price:number; total:number; }

function now(){return new Date().toISOString();}
function nextRef(table:string,prefix:string){
  const info = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as {c:number};
  return `${prefix}-${String(info.c+1).padStart(4,'0')}`;
}

function hydrateLine(r:SLRow):SourcingLine{
  return {id:r.id,sourcingRequestId:r.sourcing_request_id,sequence:r.sequence,title:r.title,description:r.description,quantity:r.quantity,unit:r.unit,awardedVendorReference:r.awarded_vendor_reference,awardedAt:r.awarded_at};
}

function hydrateRequest(r:SRRow):SourcingRequest{
  const lines = db.prepare('SELECT * FROM sourcing_lines WHERE sourcing_request_id=? ORDER BY sequence').all(r.id) as SLRow[];
  return {id:r.id,reference:r.reference,title:r.title,status:r.status,round:r.round,wholeDeliverable:r.whole_deliverable===1,anonymous:r.anonymous===1,currency:r.currency,dueDate:r.due_date,budget:r.budget,notes:r.notes,createdBy:r.created_by,lines:lines.map(hydrateLine),createdAt:r.created_at,updatedAt:r.updated_at};
}

function hydrateQuote(r:VQRow):VendorQuote{
  const lines = db.prepare('SELECT * FROM vendor_quote_lines WHERE quote_reference=?').all(r.reference) as VQLRow[];
  const vendor = db.prepare('SELECT name FROM vendors WHERE reference=?').get(r.vendor_reference) as {name:string}|undefined;
  return {id:r.id,reference:r.reference,sourcingRequestId:r.sourcing_request_id,vendorReference:r.vendor_reference,vendorName:vendor?.name??null,round:r.round,status:r.status,total:r.total,notes:r.notes,submittedAt:r.submitted_at,lines:lines.map((l)=>({id:l.id,quoteReference:l.quote_reference,lineId:l.line_id,unitPrice:l.unit_price,total:l.total})),createdAt:r.created_at,updatedAt:r.updated_at};
}

// Sourcing Requests
export function listSourcingRequests(filters:{status?:string;limit?:number;page?:number}={}):SourcingRequest[]{
  const conds:string[]=[];const params:unknown[]=[];
  if(filters.status){conds.push('status=?');params.push(filters.status);}
  const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
  const page=filters.page&&filters.page>0?filters.page:1;
  const limit=filters.limit?Number(filters.limit):20;
  const offset=(page-1)*limit;
  const rows=db.prepare(`SELECT * FROM sourcing_requests ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params,limit,offset) as SRRow[];
  return rows.map(hydrateRequest);
}

export function getSourcingRequestByIdOrRef(idOrRef:string):SourcingRequest|null{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM sourcing_requests WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM sourcing_requests WHERE reference=?').get(idOrRef)) as SRRow|undefined;
  if(!row) return null;
  return hydrateRequest(row);
}

export function createSourcingRequest(input:SourcingRequestInput):SourcingRequest{
  const ts=now();
  const tx=db.transaction(()=>{
    const ref=nextRef('sourcing_requests','SRC');
    db.prepare(`INSERT INTO sourcing_requests (reference,title,status,round,whole_deliverable,anonymous,currency,due_date,budget,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(ref,input.title,'draft',1,input.wholeDeliverable?1:0,input.anonymous?1:0,input.currency??'USD',input.dueDate??null,input.budget??null,input.notes??null,input.createdBy??'admin',ts,ts);
    const row=db.prepare('SELECT id FROM sourcing_requests WHERE reference=?').get(ref) as {id:number};
    (input.lines??[]).forEach((l,idx)=>{
      db.prepare(`INSERT INTO sourcing_lines (sourcing_request_id,sequence,title,description,quantity,unit,created_at) VALUES (?,?,?,?,?,?,?)`)
        .run(row.id,idx+1,l.title,l.description??null,l.quantity??1,l.unit??'unit',ts);
    });
    return ref;
  });
  const ref=tx();
  const sr=getSourcingRequestByIdOrRef(ref);
  if(!sr) throw new Error('Failed to create sourcing request');
  return sr;
}

export function updateSourcingRequest(idOrRef:string,patch:{title?:string;status?:string;notes?:string|null;dueDate?:string|null;budget?:number|null;round?:number}):SourcingRequest{
  const existing=getSourcingRequestByIdOrRef(idOrRef);
  if(!existing) throw new Error('Sourcing request not found');
  const fields:string[]=[];const params:Record<string,unknown>={id:existing.id};
  const map:Record<string,string>={title:'title',status:'status',notes:'notes',dueDate:'due_date',budget:'budget',round:'round'};
  for(const [k,col] of Object.entries(map)){
    if(Object.prototype.hasOwnProperty.call(patch,k)){fields.push(`${col}=@${col}`);params[col]=(patch as Record<string,unknown>)[k]??null;}
  }
  if(!fields.length) return existing;
  fields.push('updated_at=@updated_at');params.updated_at=now();
  db.prepare(`UPDATE sourcing_requests SET ${fields.join(', ')} WHERE id=@id`).run(params);
  const updated=getSourcingRequestByIdOrRef(String(existing.id));
  if(!updated) throw new Error('Failed to update');
  return updated;
}

export function publishSourcingRequest(idOrRef:string):SourcingRequest{
  const sr=getSourcingRequestByIdOrRef(idOrRef);
  if(!sr) throw new Error('Not found');
  if(sr.status!=='draft') throw new Error('Only draft requests can be published');
  return updateSourcingRequest(idOrRef,{status:'published'});
}

export function cancelSourcingRequest(idOrRef:string):SourcingRequest{
  const sr=getSourcingRequestByIdOrRef(idOrRef);
  if(!sr) throw new Error('Not found');
  if(sr.status==='awarded') throw new Error('Awarded requests cannot be cancelled');
  return updateSourcingRequest(idOrRef,{status:'cancelled'});
}

// Invites
export function inviteVendors(sourcingRequestId:number,vendorReferences:string[],round:number):SourcingInvite[]{
  const ts=now();
  const out:SourcingInvite[]=[];
  for(const vr of vendorReferences){
    try{
      db.prepare(`INSERT INTO sourcing_invites (sourcing_request_id,vendor_reference,round,status,created_at) VALUES (?,?,?,?,?)`).run(sourcingRequestId,vr,round,'pending',ts);
    }catch(e){/* ignore duplicate */}
    const row=db.prepare('SELECT * FROM sourcing_invites WHERE sourcing_request_id=? AND vendor_reference=? AND round=?').get(sourcingRequestId,vr,round) as SIRow;
    const vendor=db.prepare('SELECT name FROM vendors WHERE reference=?').get(vr) as {name:string}|undefined;
    out.push({id:row.id,sourcingRequestId:row.sourcing_request_id,vendorReference:row.vendor_reference,vendorName:vendor?.name??null,round:row.round,status:row.status,createdAt:row.created_at});
  }
  return out;
}

export function listInvites(sourcingRequestId:number,round?:number):SourcingInvite[]{
  const rows=(round?db.prepare('SELECT * FROM sourcing_invites WHERE sourcing_request_id=? AND round=?').all(sourcingRequestId,round):db.prepare('SELECT * FROM sourcing_invites WHERE sourcing_request_id=?').all(sourcingRequestId)) as SIRow[];
  return rows.map((r)=>{
    const vendor=db.prepare('SELECT name FROM vendors WHERE reference=?').get(r.vendor_reference) as {name:string}|undefined;
    return {id:r.id,sourcingRequestId:r.sourcing_request_id,vendorReference:r.vendor_reference,vendorName:vendor?.name??null,round:r.round,status:r.status,createdAt:r.created_at};
  });
}

// Quotes
export function submitQuote(input:VendorQuoteInput):VendorQuote{
  const ts=now();
  const sr=getSourcingRequestByIdOrRef(String(input.sourcingRequestId));
  if(!sr) throw new Error('Sourcing request not found');
  const round=input.round??sr.round;
  // upsert: if quote exists for vendor+round, update
  const existing=db.prepare('SELECT reference FROM vendor_quotes WHERE sourcing_request_id=? AND vendor_reference=? AND round=?').get(input.sourcingRequestId,input.vendorReference,round) as {reference:string}|undefined;
  const tx=db.transaction(()=>{
    let ref:string;
    if(existing){ref=existing.reference;}
    else {ref=nextRef('vendor_quotes','VQ');db.prepare(`INSERT INTO vendor_quotes (reference,sourcing_request_id,vendor_reference,round,status,total,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(ref,input.sourcingRequestId,input.vendorReference,round,'draft',0,input.notes??null,ts,ts);}
    // replace lines
    db.prepare('DELETE FROM vendor_quote_lines WHERE quote_reference=?').run(ref);
    let total=0;
    for(const l of input.lines){
      const lineTotal=l.unitPrice*(sr.lines.find((x)=>x.id===l.lineId)?.quantity??1);
      total+=lineTotal;
      db.prepare(`INSERT INTO vendor_quote_lines (quote_reference,line_id,unit_price,total) VALUES (?,?,?,?)`).run(ref,l.lineId,l.unitPrice,lineTotal);
    }
    db.prepare('UPDATE vendor_quotes SET total=?,notes=?,status=?,submitted_at=?,updated_at=? WHERE reference=?').run(total,input.notes??null,'submitted',ts,ts,ref);
    return ref;
  });
  const ref=tx();
  const q=getQuoteByIdOrRef(ref);
  if(!q) throw new Error('Failed');
  return q;
}

export function getQuoteByIdOrRef(idOrRef:string):VendorQuote|null{
  const isNum=/^\d+$/.test(idOrRef);
  const row=(isNum?db.prepare('SELECT * FROM vendor_quotes WHERE id=?').get(Number(idOrRef)):db.prepare('SELECT * FROM vendor_quotes WHERE reference=?').get(idOrRef)) as VQRow|undefined;
  if(!row) return null;
  return hydrateQuote(row);
}

export function listQuotes(sourcingRequestId:number,round?:number):VendorQuote[]{
  const rows=(round?db.prepare('SELECT * FROM vendor_quotes WHERE sourcing_request_id=? AND round=?').all(sourcingRequestId,round):db.prepare('SELECT * FROM vendor_quotes WHERE sourcing_request_id=?').all(sourcingRequestId)) as VQRow[];
  return rows.map(hydrateQuote);
}

// Award: per line or whole
export function awardLine(sourcingRequestId:number,lineId:number,vendorReference:string):SourcingRequest{
  const ts=now();
  db.prepare('UPDATE sourcing_lines SET awarded_vendor_reference=?, awarded_at=? WHERE id=? AND sourcing_request_id=?').run(vendorReference,ts,lineId,sourcingRequestId);
  // mark quote as won, others lost (for that line's vendor)
  const sr=getSourcingRequestByIdOrRef(String(sourcingRequestId));
  if(!sr) throw new Error('Not found');
  // check if all lines awarded
  const lines=db.prepare('SELECT awarded_vendor_reference FROM sourcing_lines WHERE sourcing_request_id=?').all(sourcingRequestId) as {awarded_vendor_reference:string|null}[];
  const allAwarded=lines.length>0 && lines.every((l)=>l.awarded_vendor_reference);
  if(allAwarded){
    db.prepare('UPDATE sourcing_requests SET status=?,updated_at=? WHERE id=?').run('awarded',ts,sourcingRequestId);
  }
  const updated=getSourcingRequestByIdOrRef(String(sourcingRequestId));
  if(!updated) throw new Error('Failed');
  return updated;
}

export function awardWhole(sourcingRequestId:number,vendorReference:string):SourcingRequest{
  const ts=now();
  const lines=db.prepare('SELECT id FROM sourcing_lines WHERE sourcing_request_id=?').all(sourcingRequestId) as {id:number}[];
  for(const l of lines){
    db.prepare('UPDATE sourcing_lines SET awarded_vendor_reference=?, awarded_at=? WHERE id=?').run(vendorReference,ts,l.id);
  }
  db.prepare('UPDATE sourcing_requests SET status=?,updated_at=? WHERE id=?').run('awarded',ts,sourcingRequestId);
  const updated=getSourcingRequestByIdOrRef(String(sourcingRequestId));
  if(!updated) throw new Error('Failed');
  return updated;
}

// Close round and open next
export function closeRoundAndOpenNext(sourcingRequestId:number):SourcingRequest{
  const sr=getSourcingRequestByIdOrRef(String(sourcingRequestId));
  if(!sr) throw new Error('Not found');
  if(sr.status!=='published') throw new Error('Only published requests can advance rounds');
  const ts=now();
  db.prepare('UPDATE sourcing_requests SET round=?,updated_at=? WHERE id=?').run(sr.round+1,ts,sr.id);
  const updated=getSourcingRequestByIdOrRef(String(sourcingRequestId));
  if(!updated) throw new Error('Failed');
  return updated;
}
