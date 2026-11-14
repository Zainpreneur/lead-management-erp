import db from './db';
import type { Asset, AssetInput, AssetCategory, AssetMaintenance } from '@/lib/types';

interface AssetRow {
  id: number;
  reference: string;
  name: string;
  category_id: number | null;
  category_name: string | null;
  status: string;
  purchase_price: number;
  currency: string;
  purchase_date: string | null;
  purchase_order_reference: string | null;
  expense_reference: string | null;
  serial_number: string | null;
  model: string | null;
  manufacturer: string | null;
  warranty_expiry: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_branch: string | null;
  business_reference: string | null;
  business_name: string | null;
  location: string | null;
  condition_rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Depreciation fields
  depreciation_rate: number | null;
  depreciation_method: string | null;
  accumulated_depreciation: number | null;
  book_value: number | null;
  // Disposal fields
  disposal_date: string | null;
  disposal_method: string | null;
  disposal_proceeds: number | null;
  disposal_cost: number | null;
  disposal_notes: string | null;
  // Vendor relationship
  vendor_reference: string | null;
  vendor_name: string | null;
}

function now() { return new Date().toISOString(); }

function hydrate(r: AssetRow): Asset {
  const isOpen = ['acquired', 'deployed', 'maintaining'].includes(r.status);
  const isTerminal = ['disposed', 'lost'].includes(r.status);
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    categoryId: r.category_id,
    categoryName: r.category_name,
    status: r.status,
    purchasePrice: r.purchase_price,
    currency: r.currency,
    purchaseDate: r.purchase_date,
    purchaseOrderReference: r.purchase_order_reference,
    expenseReference: r.expense_reference,
    serialNumber: r.serial_number,
    model: r.model,
    manufacturer: r.manufacturer,
    warrantyExpiry: r.warranty_expiry,
    assignedTo: r.assigned_to,
    assignedToName: r.assigned_to_name,
    assignedBranch: r.assigned_branch,
    businessReference: r.business_reference,
    businessName: r.business_name,
    location: r.location,
    conditionRating: r.condition_rating,
    notes: r.notes,
    open: isOpen,
    terminal: isTerminal,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    // Depreciation fields
    depreciationRate: r.depreciation_rate || 0,
    depreciationMethod: (r.depreciation_method as 'straight_line' | 'declining_balance' | 'units_of_production') || 'straight_line',
    accumulatedDepreciation: r.accumulated_depreciation || 0,
    bookValue: r.book_value || 0,
    // Disposal fields
    disposalDate: r.disposal_date || null,
    disposalMethod: (r.disposal_method as 'sale' | 'scrap' | 'donation' | 'trade_in') || null,
    disposalProceeds: r.disposal_proceeds || 0,
    disposalCost: r.disposal_cost || 0,
    disposalNotes: r.disposal_notes || null,
    // Vendor relationship
    vendorReference: r.vendor_reference || null,
    vendorName: r.vendor_name || null,
  };
}

export function listAssets(filters: { search?: string; status?: string; businessReference?: string; vendorReference?: string; limit?: number; page?: number } = {}): Asset[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(a.name LIKE ? OR a.reference LIKE ? OR a.serial_number LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.status) { conds.push('a.status = ?'); params.push(filters.status); }
  if (filters.businessReference) { conds.push('a.business_reference = ?'); params.push(filters.businessReference); }
  if (filters.vendorReference) { conds.push('a.vendor_reference = ?'); params.push(filters.vendorReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT a.*, c.name AS category_name, p.name AS assigned_to_name, b.name AS business_name FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id LEFT JOIN people p ON p.id = a.assigned_to LEFT JOIN customers b ON b.reference = a.business_reference ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as AssetRow[];
  return rows.map(hydrate);
}

export function listAssetsByVendor(vendorReference: string): Asset[] {
  return listAssets({ vendorReference, limit: 1000 });
}

export function getAssetByIdOrRef(idOrRef: string): Asset | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT a.*, c.name AS category_name, p.name AS assigned_to_name, b.name AS business_name FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id LEFT JOIN people p ON p.id = a.assigned_to LEFT JOIN customers b ON b.reference = a.business_reference WHERE a.id = ?').get(Number(idOrRef))
    : db.prepare('SELECT a.*, c.name AS category_name, p.name AS assigned_to_name, b.name AS business_name FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id LEFT JOIN people p ON p.id = a.assigned_to LEFT JOIN customers b ON b.reference = a.business_reference WHERE a.reference = ?').get(idOrRef)) as AssetRow | undefined;
  if (!row) return null;
  return hydrate(row);
}

export function createAsset(input: AssetInput): Asset {
  const ts = now();
  const info = db.prepare(`INSERT INTO assets (reference, name, category_id, status, purchase_price, currency, purchase_date, purchase_order_reference, expense_reference, serial_number, model, manufacturer, warranty_expiry, assigned_to, assigned_branch, business_reference, location, condition_rating, notes, depreciation_rate, depreciation_method, accumulated_depreciation, book_value, vendor_reference, vendor_name, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.categoryId ?? null, input.status ?? 'acquired', input.purchasePrice ?? 0, input.currency ?? 'USD', input.purchaseDate ?? null, input.purchaseOrderReference ?? null, input.expenseReference ?? null, input.serialNumber ?? null, input.model ?? null, input.manufacturer ?? null, input.warrantyExpiry ?? null, input.assignedTo ?? null, input.assignedBranch ?? null, input.businessReference ?? null, input.location ?? null, input.conditionRating ?? 5, input.notes ?? null, input.depreciationRate ?? 0, input.depreciationMethod ?? 'straight_line', 0, input.purchasePrice ?? 0, input.vendorReference ?? null, input.vendorName ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `AST-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE assets SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT a.*, c.name AS category_name, p.name AS assigned_to_name, b.name AS business_name FROM assets a LEFT JOIN asset_categories c ON c.id = a.category_id LEFT JOIN people p ON p.id = a.assigned_to LEFT JOIN customers b ON b.reference = a.business_reference WHERE a.id = ?').get(id) as AssetRow;
  return hydrate(row);
}

export function updateAsset(idOrRef: string, patch: Partial<AssetInput>): Asset {
  const existing = getAssetByIdOrRef(idOrRef);
  if (!existing) throw new Error('Asset not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    name: 'name', categoryId: 'category_id', status: 'status', purchasePrice: 'purchase_price',
    currency: 'currency', purchaseDate: 'purchase_date', purchaseOrderReference: 'purchase_order_reference',
    expenseReference: 'expense_reference', serialNumber: 'serial_number', model: 'model',
    manufacturer: 'manufacturer', warrantyExpiry: 'warranty_expiry', assignedTo: 'assigned_to',
    assignedBranch: 'assigned_branch', businessReference: 'business_reference', location: 'location',
    conditionRating: 'condition_rating', notes: 'notes',
    depreciationRate: 'depreciation_rate', depreciationMethod: 'depreciation_method',
    accumulatedDepreciation: 'accumulated_depreciation', bookValue: 'book_value',
    disposalDate: 'disposal_date', disposalMethod: 'disposal_method',
    disposalProceeds: 'disposal_proceeds', disposalCost: 'disposal_cost',
    disposalNotes: 'disposal_notes', vendorReference: 'vendor_reference', vendorName: 'vendor_name',
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
  db.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getAssetByIdOrRef(String(existing.id));
  if (!updated) throw new Error('Failed to update asset');
  return updated;
}

export function deleteAsset(idOrRef: string): void {
  const existing = getAssetByIdOrRef(idOrRef);
  if (!existing) throw new Error('Asset not found');
  db.prepare('DELETE FROM assets WHERE id = ?').run(existing.id);
}

// Asset Categories
export function listAssetCategories() {
  const rows = db.prepare('SELECT * FROM asset_categories ORDER BY name').all() as Array<{ id: number; reference: string; name: string; code: string | null; description: string | null; depreciation_rate: number; is_archived: number; created_at: string; updated_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    name: r.name,
    code: r.code,
    description: r.description,
    depreciationRate: r.depreciation_rate,
    isArchived: r.is_archived === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function createAssetCategory(input: { name: string; code?: string | null; description?: string | null; depreciationRate?: number }) {
  const ts = now();
  const info = db.prepare(`INSERT INTO asset_categories (reference, name, code, description, depreciation_rate, is_archived, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.code ?? null, input.description ?? null, input.depreciationRate ?? 0, 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `AC-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE asset_categories SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM asset_categories WHERE id = ?').get(id) as { id: number; reference: string; name: string; code: string | null; description: string | null; depreciation_rate: number; is_archived: number; created_at: string; updated_at: string };
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    code: row.code,
    description: row.description,
    depreciationRate: row.depreciation_rate,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Asset Maintenance
export function listAssetMaintenance(assetRef: string) {
  const rows = db.prepare('SELECT * FROM asset_maintenance WHERE asset_id = (SELECT id FROM assets WHERE reference = ?) ORDER BY performed_on DESC').all(assetRef) as Array<{ id: number; asset_id: number; maintenance_type: string; description: string; cost: number; currency: string; expense_reference: string | null; performed_on: string; performed_by: string | null; next_due: string | null; notes: string | null; created_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    assetId: r.asset_id,
    maintenanceType: r.maintenance_type,
    description: r.description,
    cost: r.cost,
    currency: r.currency,
    expenseReference: r.expense_reference,
    performedOn: r.performed_on,
    performedBy: r.performed_by,
    nextDue: r.next_due,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export function createAssetMaintenance(input: { assetReference: string; maintenanceType?: string; description: string; cost?: number; currency?: string; expenseReference?: string | null; performedOn: string; performedBy?: string | null; nextDue?: string | null; notes?: string | null }) {
  const ts = now();
  const asset = getAssetByIdOrRef(input.assetReference);
  if (!asset) throw new Error('Asset not found');
  const info = db.prepare(`INSERT INTO asset_maintenance (asset_id, maintenance_type, description, cost, currency, expense_reference, performed_on, performed_by, next_due, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(asset.id, input.maintenanceType ?? 'repair', input.description, input.cost ?? 0, input.currency ?? 'USD', input.expenseReference ?? null, input.performedOn, input.performedBy ?? null, input.nextDue ?? null, input.notes ?? null, ts);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM asset_maintenance WHERE id = ?').get(id) as { id: number; asset_id: number; maintenance_type: string; description: string; cost: number; currency: string; expense_reference: string | null; performed_on: string; performed_by: string | null; next_due: string | null; notes: string | null; created_at: string };
  return {
    id: row.id,
    assetId: row.asset_id,
    maintenanceType: row.maintenance_type,
    description: row.description,
    cost: row.cost,
    currency: row.currency,
    expenseReference: row.expense_reference,
    performedOn: row.performed_on,
    performedBy: row.performed_by,
    nextDue: row.next_due,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// Asset deployment
export function deployAsset(idOrRef: string, assignedTo: number | null, assignedBranch: string | null, reason: string): Asset {
  const asset = getAssetByIdOrRef(idOrRef);
  if (!asset) throw new Error('Asset not found');
  if (asset.status !== 'acquired') throw new Error('Asset must be in acquired status to deploy');
  
  const ts = now();
  db.prepare(`UPDATE assets SET status = 'deployed', assigned_to = ?, assigned_branch = ?, updated_at = ? WHERE id = ?`)
    .run(assignedTo, assignedBranch, ts, asset.id);
  
  // Record assignment
  db.prepare(`INSERT INTO asset_assignments (asset_id, assigned_to, assigned_branch, assigned_from, reason, created_at) VALUES (?,?,?,?,?,?)`)
    .run(asset.id, assignedTo, assignedBranch, ts, reason, ts);
  
  const updated = getAssetByIdOrRef(String(asset.id));
  if (!updated) throw new Error('Failed to update asset');
  return updated;
}

export function maintainAsset(idOrRef: string, reason: string): Asset {
  const asset = getAssetByIdOrRef(idOrRef);
  if (!asset) throw new Error('Asset not found');
  if (asset.status !== 'deployed') throw new Error('Asset must be deployed to maintain');
  
  const ts = now();
  db.prepare(`UPDATE assets SET status = 'maintaining', updated_at = ? WHERE id = ?`).run(ts, asset.id);
  
  const updated = getAssetByIdOrRef(String(asset.id));
  if (!updated) throw new Error('Failed to update asset');
  return updated;
}

export function loseAsset(idOrRef: string, reason: string): Asset {
  const asset = getAssetByIdOrRef(idOrRef);
  if (!asset) throw new Error('Asset not found');
  
  const ts = now();
  db.prepare(`UPDATE assets SET status = 'lost', updated_at = ? WHERE id = ?`).run(ts, asset.id);
  
  const updated = getAssetByIdOrRef(String(asset.id));
  if (!updated) throw new Error('Failed to update asset');
  return updated;
}
// Asset Depreciation
export function calculateMonthlyDepreciation(asset: Asset): number {
  if (!asset.depreciationRate || asset.depreciationRate <= 0) return 0;
  
  const annualDepreciation = asset.purchasePrice * (asset.depreciationRate / 100);
  const monthlyDepreciation = annualDepreciation / 12;
  
  // Don't depreciate below 0
  const remainingValue = asset.purchasePrice - (asset.accumulatedDepreciation || 0);
  return Math.min(monthlyDepreciation, Math.max(0, remainingValue));
}

export function calculateDepreciation(asset: Asset): {
  monthlyDepreciation: number;
  annualDepreciation: number;
  remainingValue: number;
  monthsRemaining: number;
} {
  if (!asset.depreciationRate || asset.depreciationRate <= 0) {
    return { monthlyDepreciation: 0, annualDepreciation: 0, remainingValue: asset.purchasePrice, monthsRemaining: 0 };
  }
  
  const annualDepreciation = asset.purchasePrice * (asset.depreciationRate / 100);
  const monthlyDepreciation = annualDepreciation / 12;
  const accumulated = asset.accumulatedDepreciation || 0;
  const remainingValue = Math.max(0, asset.purchasePrice - accumulated);
  const monthsRemaining = monthlyDepreciation > 0 ? Math.ceil(remainingValue / monthlyDepreciation) : 0;
  
  return {
    monthlyDepreciation: Math.min(monthlyDepreciation, remainingValue),
    annualDepreciation,
    remainingValue,
    monthsRemaining,
  };
}

export function calculateAllDepreciation(): { processed: number; totalDepreciation: number; errors: string[] } {
  const ts = now();
  const assets = db.prepare(`
    SELECT * FROM assets 
    WHERE status IN ('acquired', 'deployed', 'maintaining') 
    AND depreciation_rate > 0
  `).all() as AssetRow[];
  
  let processed = 0;
  let totalDepreciation = 0;
  const errors: string[] = [];
  
  for (const assetRow of assets) {
    try {
      const asset = hydrate(assetRow);
      const dep = calculateMonthlyDepreciation(asset);
      
      if (dep <= 0) continue;
      
      const currentAsset = asset; // Capture for transaction closure
      const tx = db.transaction(() => {
        const currentAsset = asset; // Capture for transaction closure
        const newAccumulated = (currentAsset.accumulatedDepreciation || 0) + dep;
        const newBookValue = Math.max(0, currentAsset.purchasePrice - newAccumulated);
        
        // Create depreciation expense
        db.prepare(`INSERT INTO expenses (reference, title, category, amount, currency, status, expense_date, notes, vendor_reference, asset_reference, is_asset_purchase, asset_category, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run('tmp', `Depreciation: ${currentAsset.name}`, 'asset_depreciation', dep, currentAsset.currency, 'paid', now().slice(0, 10), `Monthly depreciation (${currentAsset.depreciationRate}%/yr, ${currentAsset.depreciationMethod})`, null, currentAsset.reference, 1, 'depreciation', now(), now());
        
        // Update asset
        db.prepare('UPDATE assets SET accumulated_depreciation = ?, book_value = ?, updated_at = ? WHERE id = ?')
          .run(newAccumulated, newBookValue, now(), currentAsset.id);
      });
      tx();
      
      processed++;
      totalDepreciation += dep;
    } catch (e) {
      errors.push(`Asset ${assetRow.reference}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  return { processed, totalDepreciation, errors };
}

// Asset Disposal
export function disposeAsset(idOrRef: string, disposal: { disposalDate: string; disposalMethod: 'sale' | 'scrap' | 'donation' | 'trade_in'; disposalProceeds: number; disposalCost?: number; disposalVendorRef?: string; disposalNotes?: string }): Asset {
  const asset = getAssetByIdOrRef(idOrRef);
  if (!asset) throw new Error('Asset not found');
  if (!['deployed', 'maintaining'].includes(asset.status)) throw new Error('Asset must be deployed or maintaining to dispose');
  
  const ts = now();
  const proceeds = disposal.disposalProceeds || 0;
  const cost = disposal.disposalCost || 0;
  
  const tx = db.transaction(() => {
    // Update asset
    db.prepare(`UPDATE assets SET status = 'disposed', disposal_date = ?, disposal_method = ?, disposal_proceeds = ?, disposal_cost = ?, updated_at = ? WHERE id = ?`)
      .run(disposal.disposalDate, disposal.disposalMethod, disposal.disposalProceeds, disposal.disposalCost || 0, ts, asset.id);
    
    // Create disposal expense if there are costs
    if (disposal.disposalCost && disposal.disposalCost > 0) {
      db.prepare(`INSERT INTO expenses (reference, title, category, amount, currency, status, expense_date, notes, vendor_reference, asset_reference, is_asset_purchase, asset_category, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('tmp', `Disposal: ${asset.name}`, 'asset_disposal', disposal.disposalCost, asset.currency, 'paid', disposal.disposalDate, disposal.disposalNotes || `Disposal costs for ${asset.name}`, disposal.disposalVendorRef || null, asset.reference, 0, 'disposal', ts, ts);
    }
    
    // Record disposal proceeds as income (negative expense)
    const proceeds = disposal.disposalProceeds || 0;
    if (proceeds > 0) {
      db.prepare(`INSERT INTO expenses (reference, title, category, amount, currency, status, expense_date, notes, vendor_reference, asset_reference, is_asset_purchase, asset_category, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('tmp', `Disposal Proceeds: ${asset.name}`, 'asset_disposal_proceeds', -proceeds, asset.currency, 'paid', disposal.disposalDate, `Proceeds from ${disposal.disposalMethod} of ${asset.name}`, disposal.disposalVendorRef || null, asset.reference, 0, 'disposal_proceeds', ts, ts);
    }
  });
  tx();
  
  const updated = getAssetByIdOrRef(String(asset.id));
  if (!updated) throw new Error('Failed to dispose asset');
  return updated;
}

// TCO Calculation
export function calculateAssetTCO(assetRef: string): {
  asset: Asset;
  purchasePrice: number;
  totalMaintenance: number;
  totalDepreciation: number;
  disposalProceeds: number;
  disposalCosts: number;
  tco: number;
} | null {
  const asset = getAssetByIdOrRef(assetRef);
  if (!asset) return null;
  
  const maintenance = db.prepare('SELECT SUM(cost) as total FROM asset_maintenance WHERE asset_id = ?').get(asset.id) as { total: number } | null;
  const purchasePrice = asset.purchasePrice;
  const totalMaintenance = maintenance?.total || 0;
  const totalDepreciation = asset.accumulatedDepreciation || 0;
  const disposalProceeds = asset.disposalProceeds || 0;
  const disposalCosts = asset.disposalCost || 0;
  
  const tco = purchasePrice + totalMaintenance + totalDepreciation + disposalCosts - disposalProceeds;
  
  return {
    asset,
    purchasePrice,
    totalMaintenance,
    totalDepreciation,
    disposalProceeds,
    disposalCosts,
    tco,
  };
}
