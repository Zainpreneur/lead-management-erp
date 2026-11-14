import db from './db';
import type { Vendor, VendorInput, PurchaseOrder, PurchaseOrderInput, PurchaseOrderItem, InventoryAdjustment, GoodsReceipt, GoodsReceiptItem, GoodsReceiptInput } from '@/lib/types';

interface VendorRow {
  id: number;
  reference: string;
  name: string;
  code: string | null;
  kind: string;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface PORow {
  id: number;
  reference: string;
  vendor_reference: string;
  vendor_name: string;
  status: string;
  total_amount: number;
  currency: string;
  order_date: string;
  expected_delivery: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface POItemRow {
  id: number;
  po_reference: string;
  product_reference: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  received_quantity: number;
  sort_order: number;
}

interface AdjRow {
  id: number;
  reference: string;
  product_reference: string;
  type: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateVendor(r: VendorRow): Vendor {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    code: r.code,
    kind: r.kind,
    status: r.status,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    address: r.address,
    city: r.city,
    country: r.country,
    taxId: r.tax_id,
    paymentTerms: r.payment_terms,
    notes: r.notes,
    rating: r.rating,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydratePOItem(r: POItemRow): PurchaseOrderItem {
  return {
    id: r.id,
    poReference: r.po_reference,
    productReference: r.product_reference,
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    lineTotal: r.line_total,
    receivedQuantity: r.received_quantity,
    sortOrder: r.sort_order,
  };
}

function hydratePO(r: PORow): PurchaseOrder {
  const items = db.prepare('SELECT * FROM purchase_order_items WHERE po_reference = ? ORDER BY sort_order, id').all(r.reference) as POItemRow[];
  return {
    id: r.id,
    reference: r.reference,
    vendorReference: r.vendor_reference,
    vendorName: r.vendor_name,
    status: r.status,
    totalAmount: r.total_amount,
    currency: r.currency,
    orderDate: r.order_date,
    expectedDelivery: r.expected_delivery,
    notes: r.notes,
    items: items.map(hydratePOItem),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Vendors
export function listVendors(filters: { search?: string; status?: string; kind?: string; limit?: number; page?: number } = {}): Vendor[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(name LIKE ? OR code LIKE ? OR city LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  if (filters.kind) { conds.push('kind = ?'); params.push(filters.kind); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM vendors ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as VendorRow[];
  return rows.map(hydrateVendor);
}

export function getVendorByIdOrRef(idOrRef: string): Vendor | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT * FROM vendors WHERE id = ?').get(Number(idOrRef))
    : db.prepare('SELECT * FROM vendors WHERE reference = ?').get(idOrRef)) as VendorRow | undefined;
  if (!row) return null;
  return hydrateVendor(row);
}

export function createVendor(input: VendorInput): Vendor {
  const ts = now();
  const info = db.prepare(`INSERT INTO vendors (reference, name, code, kind, status, contact_name, contact_email, contact_phone, address, city, country, tax_id, payment_terms, notes, rating, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.code ?? null, input.kind ?? 'supplier', input.status ?? 'active', input.contactName ?? null, input.contactEmail ?? null, input.contactPhone ?? null, input.address ?? null, input.city ?? null, input.country ?? null, input.taxId ?? null, input.paymentTerms ?? null, input.notes ?? null, input.rating ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `VEN-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE vendors SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as VendorRow;
  return hydrateVendor(row);
}

export function updateVendor(idOrRef: string, patch: Partial<VendorInput>): Vendor {
  const existing = getVendorByIdOrRef(idOrRef);
  if (!existing) throw new Error('Vendor not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    name: 'name', code: 'code', kind: 'kind', status: 'status', contactName: 'contact_name',
    contactEmail: 'contact_email', contactPhone: 'contact_phone', address: 'address', city: 'city',
    country: 'country', taxId: 'tax_id', paymentTerms: 'payment_terms', notes: 'notes', rating: 'rating',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return existing;
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE vendors SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getVendorByIdOrRef(String(existing.id));
  if (!updated) throw new Error('Failed to update vendor');
  return updated;
}

export function deleteVendor(idOrRef: string): void {
  const existing = getVendorByIdOrRef(idOrRef);
  if (!existing) throw new Error('Vendor not found');
  db.prepare('DELETE FROM vendors WHERE id = ?').run(existing.id);
}

// Purchase Orders
export function listPurchaseOrders(filters: { search?: string; status?: string; vendorReference?: string; limit?: number; page?: number } = {}): PurchaseOrder[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(po.reference LIKE ? OR po.vendor_name LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.status) { conds.push('po.status = ?'); params.push(filters.status); }
  if (filters.vendorReference) { conds.push('po.vendor_reference = ?'); params.push(filters.vendorReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM purchase_orders po ${where} ORDER BY po.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as PORow[];
  return rows.map(hydratePO);
}

export function getPurchaseOrderByIdOrRef(idOrRef: string): PurchaseOrder | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(Number(idOrRef))
    : db.prepare('SELECT * FROM purchase_orders WHERE reference = ?').get(idOrRef)) as PORow | undefined;
  if (!row) return null;
  return hydratePO(row);
}

export function createPurchaseOrder(input: PurchaseOrderInput): PurchaseOrder {
  const ts = now();
  const items = input.items ?? [];
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  
  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO purchase_orders (reference, vendor_reference, vendor_name, status, total_amount, currency, order_date, expected_delivery, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run('tmp', input.vendorReference, input.vendorReference, input.status ?? 'draft', totalAmount, input.currency ?? 'USD', input.orderDate ?? ts.slice(0, 10), input.expectedDelivery ?? null, input.notes ?? null, ts, ts);
    const id = Number(info.lastInsertRowid);
    const ref = `PO-${String(id).padStart(4, '0')}`;
    db.prepare('UPDATE purchase_orders SET reference = ?, vendor_name = (SELECT name FROM vendors WHERE reference = ?) WHERE id = ?').run(ref, input.vendorReference, id);
    
    items.forEach((item, idx) => {
      const qty = item.quantity ?? 1;
      const price = item.unitPrice ?? 0;
      db.prepare(`INSERT INTO purchase_order_items (po_reference, product_reference, description, quantity, unit_price, line_total, received_quantity, sort_order) VALUES (?,?,?,?,?,?,?,?)`)
        .run(ref, item.productReference ?? null, item.description, qty, price, qty * price, 0, idx);
    });
    
    return id;
  });
  const id = tx();
  const po = getPurchaseOrderByIdOrRef(String(id));
  if (!po) throw new Error('Failed to create purchase order');
  return po;
}

export function updatePurchaseOrder(idOrRef: string, patch: { status?: string; notes?: string | null; expectedDelivery?: string | null }): PurchaseOrder {
  const existing = getPurchaseOrderByIdOrRef(idOrRef);
  if (!existing) throw new Error('Purchase order not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { status: 'status', notes: 'notes', expectedDelivery: 'expected_delivery' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return existing;
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getPurchaseOrderByIdOrRef(String(existing.id));
  if (!updated) throw new Error('Failed to update purchase order');
  return updated;
}

export function deletePurchaseOrder(idOrRef: string): void {
  const existing = getPurchaseOrderByIdOrRef(idOrRef);
  if (!existing) throw new Error('Purchase order not found');
  db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(existing.id);
}

// Inventory Adjustments
export function listInventoryAdjustments(filters: { productReference?: string; type?: string; limit?: number; page?: number } = {}): InventoryAdjustment[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.productReference) { conds.push('product_reference = ?'); params.push(filters.productReference); }
  if (filters.type) { conds.push('type = ?'); params.push(filters.type); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM inventory_adjustments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as AdjRow[];
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    productReference: r.product_reference,
    type: r.type,
    quantity: r.quantity,
    reason: r.reason,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

export function createInventoryAdjustment(input: { productReference: string; type?: string; quantity: number; reason?: string | null; notes?: string | null; createdBy?: string | null }): InventoryAdjustment {
  const ts = now();
  const info = db.prepare(`INSERT INTO inventory_adjustments (reference, product_reference, type, quantity, reason, notes, created_by, created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('tmp', input.productReference, input.type ?? 'adjustment', input.quantity, input.reason ?? null, input.notes ?? null, input.createdBy ?? null, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `ADJ-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE inventory_adjustments SET reference = ? WHERE id = ?').run(ref, id);
  // Update product stock
  db.prepare('UPDATE products SET stock = stock + ? WHERE reference = ?').run(input.quantity, input.productReference);
  const row = db.prepare('SELECT * FROM inventory_adjustments WHERE id = ?').get(id) as AdjRow;
  return {
    id: row.id,
    reference: row.reference,
    productReference: row.product_reference,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
// ---------- Goods Receipts ----------

interface GRRow {
  id: number;
  reference: string;
  po_reference: string;
  vendor_reference: string | null;
  received_date: string;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface GRItemRow {
  id: number;
  receipt_reference: string;
  po_item_id: number;
  product_reference: string | null;
  description: string;
  quantity_received: number;
  unit_price: number;
  sort_order: number;
}

function hydrateGRItem(r: GRItemRow): GoodsReceiptItem {
  return {
    id: r.id,
    receiptReference: r.receipt_reference,
    poItemId: r.po_item_id,
    productReference: r.product_reference,
    description: r.description,
    quantityReceived: r.quantity_received,
    unitPrice: r.unit_price,
    sortOrder: r.sort_order,
  };
}

function hydrateGR(r: GRRow): GoodsReceipt {
  const items = db.prepare('SELECT * FROM goods_receipt_items WHERE receipt_reference = ? ORDER BY sort_order, id').all(r.reference) as GRItemRow[];
  return {
    id: r.id,
    reference: r.reference,
    poReference: r.po_reference,
    vendorReference: r.vendor_reference,
    receivedDate: r.received_date,
    receivedBy: r.received_by,
    notes: r.notes,
    items: items.map(hydrateGRItem),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function nextGRReference() {
  const info = db.prepare("SELECT COUNT(*) as c FROM goods_receipts").get() as { c: number };
  return `GR-${String(info.c + 1).padStart(4, '0')}`;
}

export function listGoodsReceipts(filters: { poReference?: string; limit?: number; page?: number } = {}): GoodsReceipt[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.poReference) { conds.push('po_reference = ?'); params.push(filters.poReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 50;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM goods_receipts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as GRRow[];
  return rows.map(hydrateGR);
}

export function getGoodsReceiptByIdOrRef(idOrRef: string): GoodsReceipt | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT * FROM goods_receipts WHERE id = ?').get(Number(idOrRef))
    : db.prepare('SELECT * FROM goods_receipts WHERE reference = ?').get(idOrRef)) as GRRow | undefined;
  if (!row) return null;
  return hydrateGR(row);
}

export function createGoodsReceipt(input: GoodsReceiptInput): GoodsReceipt {
  const ts = now();
  const po = getPurchaseOrderByIdOrRef(input.poReference);
  if (!po) throw new Error('Purchase order not found');

  const tx = db.transaction(() => {
    const ref = nextGRReference();
    db.prepare(`INSERT INTO goods_receipts (reference, po_reference, vendor_reference, received_date, received_by, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(ref, input.poReference, po.vendorReference, input.receivedDate ?? ts.slice(0, 10), input.receivedBy ?? null, input.notes ?? null, ts, ts);

    (input.items ?? []).forEach((it, idx) => {
      const poItem = po.items.find((i) => i.id === it.poItemId);
      if (!poItem) throw new Error(`PO item ${it.poItemId} not found`);
      const qty = Number(it.quantityReceived) || 0;
      if (qty < 0) throw new Error('Quantity received cannot be negative');
      // Cap at outstanding
      const outstanding = poItem.quantity - poItem.receivedQuantity;
      if (qty > outstanding + 1e-9) throw new Error(`Quantity received (${qty}) exceeds outstanding (${outstanding}) for ${poItem.description}`);
      db.prepare(`INSERT INTO goods_receipt_items (receipt_reference, po_item_id, product_reference, description, quantity_received, unit_price, sort_order) VALUES (?,?,?,?,?,?,?)`)
        .run(ref, poItem.id, poItem.productReference, poItem.description, qty, poItem.unitPrice, idx);
      db.prepare('UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?').run(qty, poItem.id);
    });

    // Update PO status based on receiving
    const updatedPO = getPurchaseOrderByIdOrRef(input.poReference);
    if (updatedPO) {
      const allReceived = updatedPO.items.every((i) => i.receivedQuantity >= i.quantity - 1e-9);
      const anyReceived = updatedPO.items.some((i) => i.receivedQuantity > 0);
      let newStatus = updatedPO.status;
      if (allReceived) newStatus = 'received';
      else if (anyReceived) newStatus = 'partially_received';
      if (newStatus !== updatedPO.status && !['cancelled', 'closed'].includes(updatedPO.status)) {
        db.prepare('UPDATE purchase_orders SET status = ?, updated_at = ? WHERE reference = ?').run(newStatus, ts, input.poReference);
      }
    }

    return ref;
  });
  const ref = tx();
  const gr = getGoodsReceiptByIdOrRef(ref);
  if (!gr) throw new Error('Failed to create goods receipt');
  return gr;
}

// Receiving status per PO item
export function getPOReceivingStatus(poReference: string): { poReference: string; items: Array<{ id: number; description: string; productReference: string | null; ordered: number; received: number; outstanding: number; fullyReceived: boolean }>; fullyReceived: boolean; partiallyReceived: boolean } | null {
  const po = getPurchaseOrderByIdOrRef(poReference);
  if (!po) return null;
  const items = po.items.map((i) => ({
    id: i.id,
    description: i.description,
    productReference: i.productReference,
    ordered: i.quantity,
    received: i.receivedQuantity,
    outstanding: Math.max(0, i.quantity - i.receivedQuantity),
    fullyReceived: i.receivedQuantity >= i.quantity - 1e-9,
  }));
  const fullyReceived = items.length > 0 && items.every((i) => i.fullyReceived);
  const partiallyReceived = items.some((i) => i.received > 0) && !fullyReceived;
  return { poReference, items, fullyReceived, partiallyReceived };
}

// Invoice gate: a vendor invoice may be paid only if goods have been received.
export function invoiceGate(poReference: string): { allowed: boolean; reason: string; receivedValue: number; orderedValue: number; receivedPercent: number } {
  const status = getPOReceivingStatus(poReference);
  if (!status) return { allowed: false, reason: 'Purchase order not found', receivedValue: 0, orderedValue: 0, receivedPercent: 0 };
  const po = getPurchaseOrderByIdOrRef(poReference);
  if (!po) return { allowed: false, reason: 'Purchase order not found', receivedValue: 0, orderedValue: 0, receivedPercent: 0 };
  const receivedValue = po.items.reduce((s, i) => s + i.receivedQuantity * i.unitPrice, 0);
  const orderedValue = po.totalAmount;
  const receivedPercent = orderedValue > 0 ? (receivedValue / orderedValue) * 100 : 0;
  if (status.fullyReceived) {
    return { allowed: true, reason: 'All goods received', receivedValue, orderedValue, receivedPercent };
  }
  if (status.partiallyReceived) {
    return { allowed: false, reason: 'Partial receipt only — invoice blocked until full delivery', receivedValue, orderedValue, receivedPercent };
  }
  return { allowed: false, reason: 'No goods received yet — invoice blocked', receivedValue, orderedValue, receivedPercent };
}

// ---------- Stock Transfers ----------

interface STRow {
  id: number;
  reference: string;
  from_location: string;
  to_location: string;
  product_reference: string;
  product_name: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function hydrateST(r: STRow): import('@/lib/types').StockTransfer {
  return {
    id: r.id,
    reference: r.reference,
    fromLocation: r.from_location,
    toLocation: r.to_location,
    productReference: r.product_reference,
    productName: r.product_name,
    quantity: r.quantity,
    status: r.status,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function nextSTReference() {
  const info = db.prepare("SELECT COUNT(*) as c FROM stock_transfers").get() as { c: number };
  return `ST-${String(info.c + 1).padStart(4, '0')}`;
}

export function listStockTransfers(filters: { status?: string; productReference?: string; limit?: number; page?: number } = {}): import('@/lib/types').StockTransfer[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  if (filters.productReference) { conds.push('product_reference = ?'); params.push(filters.productReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 20;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM stock_transfers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as STRow[];
  return rows.map(hydrateST);
}

export function createStockTransfer(input: { fromLocation: string; toLocation: string; productReference: string; quantity: number; notes?: string | null; createdBy?: string | null }): import('@/lib/types').StockTransfer {
  const ts = now();
  const product = db.prepare('SELECT name FROM products WHERE reference = ?').get(input.productReference) as { name: string } | undefined;
  if (!product) throw new Error('Product not found');
  if (input.fromLocation === input.toLocation) throw new Error('From and to locations must differ');
  if (input.quantity <= 0) throw new Error('Quantity must be positive');
  const ref = nextSTReference();
  db.prepare(`INSERT INTO stock_transfers (reference, from_location, to_location, product_reference, product_name, quantity, status, notes, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ref, input.fromLocation, input.toLocation, input.productReference, product.name, input.quantity, 'pending', input.notes ?? null, input.createdBy ?? null, ts, ts);
  const row = db.prepare('SELECT * FROM stock_transfers WHERE reference = ?').get(ref) as STRow;
  return hydrateST(row);
}

export function updateStockTransferStatus(reference: string, status: string): import('@/lib/types').StockTransfer {
  const ts = now();
  const row = db.prepare('SELECT * FROM stock_transfers WHERE reference = ?').get(reference) as STRow | undefined;
  if (!row) throw new Error('Stock transfer not found');
  // On completion, adjust product stock? Global stock unchanged for transfer; just mark completed.
  db.prepare('UPDATE stock_transfers SET status = ?, updated_at = ? WHERE reference = ?').run(status, ts, reference);
  const updated = db.prepare('SELECT * FROM stock_transfers WHERE reference = ?').get(reference) as STRow;
  return hydrateST(updated);
}
