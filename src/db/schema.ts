import { sqliteTable, integer, text, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// CORE TABLES
// ============================================

export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').unique(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  team: text('team'),
  role: text('role'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  category: text('category'),
  city: text('city'),
  country: text('country'),
  source: text('source').notNull().default('other'),
  stage: text('stage').notNull().default('new'),
  priority: text('priority').notNull().default('warm'),
  score: integer('score').notNull().default(0),
  estimatedValue: real('estimated_value').notNull().default(0),
  contactName: text('contact_name'),
  contactRole: text('contact_role'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  social: text('social'),
  notes: text('notes'),
  assignedTo: integer('assigned_to').references(() => people.id),
  assignedTeam: text('assigned_team'),
  followUpDate: text('follow_up_date'),
  lastContactedAt: text('last_contacted_at'),
  reminderDays: integer('reminder_days').notNull().default(3),
  convertedAt: text('converted_at'),
  lostReason: text('lost_reason'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  stageIdx: index('leads_stage_idx').on(table.stage),
  assignedToIdx: index('leads_assigned_to_idx').on(table.assignedTo),
  sourceIdx: index('leads_source_idx').on(table.source),
}));

export const leadActivities = sqliteTable('lead_activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  summary: text('summary').notNull(),
  outcome: text('outcome'),
  actor: text('actor').notNull().default('system'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  leadIdIdx: index('lead_activities_lead_id_idx').on(table.leadId),
}));

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  leadId: integer('lead_id').references(() => leads.id),
  leadReference: text('lead_reference'),
  name: text('name').notNull(),
  category: text('category'),
  city: text('city'),
  country: text('country'),
  contactName: text('contact_name'),
  contactRole: text('contact_role'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  social: text('social'),
  notes: text('notes'),
  assignedTo: integer('assigned_to').references(() => people.id),
  assignedTeam: text('assigned_team'),
  status: text('status').notNull().default('active'),
  mrr: real('mrr').notNull().default(0),
  totalValue: real('total_value').notNull().default(0),
  firstConvertedAt: text('first_converted_at').notNull(),
  lastActivityAt: text('last_activity_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index('customers_status_idx').on(table.status),
  assignedToIdx: index('customers_assigned_to_idx').on(table.assignedTo),
}));

export const customerActivities = sqliteTable('customer_activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  summary: text('summary').notNull(),
  outcome: text('outcome'),
  actor: text('actor').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  customerIdIdx: index('customer_activities_customer_id_idx').on(table.customerId),
}));

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  customerReference: text('customer_reference').notNull(),
  customerName: text('customer_name').notNull(),
  leadReference: text('lead_reference'),
  proposalReference: text('proposal_reference'),
  status: text('status').notNull().default('draft'),
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  paidDate: text('paid_date'),
  notes: text('notes'),
  terms: text('terms'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  customerRefIdx: index('invoices_customer_reference_idx').on(table.customerReference),
  statusIdx: index('invoices_status_idx').on(table.status),
}));

export const invoiceLineItems = sqliteTable('invoice_line_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceReference: text('invoice_reference').notNull(),
  productReference: text('product_reference'),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  discountPercent: real('discount_percent').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  lineTotal: real('line_total').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  invoiceRefIdx: index('invoice_line_items_invoice_reference_idx').on(table.invoiceReference),
}));

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  invoiceReference: text('invoice_reference').notNull(),
  customerReference: text('customer_reference'),
  amount: real('amount').notNull().default(0),
  method: text('method').notNull(),
  status: text('status').notNull().default('pending'),
  paidAt: text('paid_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  invoiceRefIdx: index('payments_invoice_reference_idx').on(table.invoiceReference),
}));

export const proposals = sqliteTable('proposals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  leadReference: text('lead_reference'),
  customerReference: text('customer_reference'),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  subtotal: real('subtotal').notNull().default(0),
  discountType: text('discount_type'),
  discountValue: real('discount_value').notNull().default(0),
  total: real('total').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  validUntil: text('valid_until'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  leadRefIdx: index('proposals_lead_reference_idx').on(table.leadReference),
  customerRefIdx: index('proposals_customer_reference_idx').on(table.customerReference),
}));

export const proposalLines = sqliteTable('proposal_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  proposalReference: text('proposal_reference').notNull(),
  productReference: text('product_reference'),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  lineTotal: real('line_total').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => ({
  proposalRefIdx: index('proposal_lines_proposal_reference_idx').on(table.proposalReference),
}));

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  relatedType: text('related_type'),
  relatedReference: text('related_reference'),
  dueDate: text('due_date'),
  status: text('status').notNull().default('open'),
  priority: text('priority').notNull().default('medium'),
  assignedTo: integer('assigned_to').references(() => people.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index('tasks_status_idx').on(table.status),
  assignedToIdx: index('tasks_assigned_to_idx').on(table.assignedTo),
  relatedIdx: index('tasks_related_idx').on(table.relatedType, table.relatedReference),
}));

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  sku: text('sku'),
  type: text('type').notNull(),
  price: real('price').notNull().default(0),
  cost: real('cost').notNull().default(0),
  stock: real('stock').notNull().default(0),
  status: text('status').notNull().default('active'),
  description: text('description'),
  reorderPoint: real('reorder_point').notNull().default(0),
  reorderQuantity: real('reorder_quantity').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  customerReference: text('customer_reference'),
  accountName: text('account_name'),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'),
  phone: text('phone'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityReference: text('entity_reference').notNull(),
  action: text('action').notNull(),
  actor: text('actor').notNull(),
  details: text('details'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityReference),
}));

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull().default('general'),
  amount: real('amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'),
  expenseDate: text('expense_date').notNull(),
  paidBy: text('paid_by'),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  vendorReference: text('vendor_reference'),
  assetReference: text('asset_reference'),
  purchaseOrderReference: text('purchase_order_reference'),
  assetCategory: text('asset_category'),
  isAssetPurchase: integer('is_asset_purchase', { mode: 'boolean' }).notNull().default(false),
  assetDepreciationReference: text('asset_depreciation_reference'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index('expenses_status_idx').on(table.status),
  categoryIdx: index('expenses_category_idx').on(table.category),
}));

export const businessBranches = sqliteTable('business_branches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  businessReference: text('business_reference').notNull(),
  code: text('code'),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('active'),
  location: text('location'),
  address: text('address'),
  currency: text('currency').notNull().default('USD'),
  timezone: text('timezone').notNull().default('UTC'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const businessCommunications = sqliteTable('business_communications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  businessReference: text('business_reference').notNull(),
  contactId: integer('contact_id').references(() => contacts.id),
  kind: text('kind').notNull(),
  subject: text('subject').notNull(),
  body: text('body'),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: text('created_by'),
});

export const serviceRequests = sqliteTable('service_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  businessReference: text('business_reference'),
  title: text('title').notNull(),
  status: text('status').notNull().default('Draft'),
  priority: text('priority').notNull().default('normal'),
  requestedBy: text('requested_by').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactRole: text('contact_role'),
  assignedTeam: text('assigned_team'),
  assignedTo: integer('assigned_to').references(() => people.id),
  requiredDate: text('required_date'),
  specialRequirements: text('special_requirements'),
  finalAmount: real('final_amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const helpdeskTickets = sqliteTable('helpdesk_tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  businessReference: text('business_reference'),
  serviceRequestReference: text('service_request_reference'),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull().default('normal'),
  status: text('status').notNull().default('New'),
  assignedTeam: text('assigned_team'),
  assignedTo: integer('assigned_to').references(() => people.id),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  resolution: text('resolution'),
  resolutionSummary: text('resolution_summary'),
  slaDueAt: text('sla_due_at'),
  resolvedAt: text('resolved_at'),
  closedAt: text('closed_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ticketMessages = sqliteTable('ticket_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketReference: text('ticket_reference').notNull(),
  author: text('author').notNull(),
  authorRole: text('author_role').notNull(),
  visibility: text('visibility').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  ticketRefIdx: index('ticket_messages_ticket_reference_idx').on(table.ticketReference),
}));

// ============================================
// USERS & AUTH (Better Auth compatible)
// ============================================

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  team: text('team'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

// ============================================
// FINANCE
// ============================================

export const cashAccounts = sqliteTable('cash_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  currency: text('currency').notNull().default('USD'),
  balance: real('balance').notNull().default(0),
  accountNumber: text('account_number'),
  bankName: text('bank_name'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cashTransactions = sqliteTable('cash_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  accountReference: text('account_reference').notNull(),
  type: text('type').notNull(),
  amount: real('amount').notNull().default(0),
  description: text('description'),
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  reconciled: integer('reconciled', { mode: 'boolean' }).notNull().default(false),
  transactionDate: text('transaction_date').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  accountRefIdx: index('cash_transactions_account_reference_idx').on(table.accountReference),
}));

export const taxRates = sqliteTable('tax_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  rate: real('rate').notNull().default(0),
  type: text('type').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const currencies = sqliteTable('currencies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  exchangeRate: real('exchange_rate').notNull().default(1),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const financialReports = sqliteTable('financial_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  type: text('type').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  data: text('data').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  entityType: text('entity_type').notNull(),
  entityReference: text('entity_reference').notNull(),
  uploadedBy: text('uploaded_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  entityIdx: index('documents_entity_idx').on(table.entityType, table.entityReference),
}));

// ============================================
// PROCUREMENT & VENDORS
// ============================================

export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  code: text('code'),
  kind: text('kind').notNull().default('supplier'),
  status: text('status').notNull().default('active'),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  taxId: text('tax_id'),
  paymentTerms: text('payment_terms'),
  notes: text('notes'),
  rating: real('rating'),
  // Scorecard fields
  onTimeDeliveryRate: real('on_time_delivery_rate').default(0),
  defectRate: real('defect_rate').default(0),
  responsivenessScore: real('responsiveness_score').default(0),
  overallScore: real('overall_score').default(0),
  financialRisk: text('financial_risk').default('low'),
  operationalRisk: text('operational_risk').default('low'),
  complianceRisk: text('compliance_risk').default('low'),
  lastAssessed: text('last_assessed'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  vendorReference: text('vendor_reference').notNull(),
  vendorName: text('vendor_name').notNull(),
  status: text('status').notNull().default('draft'),
  totalAmount: real('total_amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  orderDate: text('order_date').notNull(),
  expectedDelivery: text('expected_delivery'),
  notes: text('notes'),
  assetCreated: integer('asset_created', { mode: 'boolean' }).notNull().default(false),
  assetReferences: text('asset_references'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vendorRefIdx: index('purchase_orders_vendor_reference_idx').on(table.vendorReference),
  statusIdx: index('purchase_orders_status_idx').on(table.status),
}));

export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poReference: text('po_reference').notNull(),
  productReference: text('product_reference'),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  lineTotal: real('line_total').notNull().default(0),
  receivedQuantity: real('received_quantity').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  serialNumber: text('serial_number'),
  model: text('model'),
  manufacturer: text('manufacturer'),
}, (table) => ({
  poRefIdx: index('purchase_order_items_po_reference_idx').on(table.poReference),
}));

export const inventoryAdjustments = sqliteTable('inventory_adjustments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  productReference: text('product_reference').notNull(),
  type: text('type').notNull(),
  quantity: real('quantity').notNull().default(0),
  reason: text('reason'),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const goodsReceipts = sqliteTable('goods_receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  poReference: text('po_reference').notNull(),
  vendorReference: text('vendor_reference'),
  receivedDate: text('received_date').notNull(),
  receivedBy: text('received_by'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  poRefIdx: index('goods_receipts_po_reference_idx').on(table.poReference),
}));

export const goodsReceiptItems = sqliteTable('goods_receipt_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  receiptReference: text('receipt_reference').notNull(),
  poItemId: integer('po_item_id').notNull(),
  productReference: text('product_reference'),
  description: text('description').notNull(),
  quantityReceived: real('quantity_received').notNull().default(0),
  unitPrice: real('unit_price').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => ({
  receiptRefIdx: index('goods_receipt_items_receipt_reference_idx').on(table.receiptReference),
}));

export const stockTransfers = sqliteTable('stock_transfers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  fromLocation: text('from_location').notNull(),
  toLocation: text('to_location').notNull(),
  productReference: text('product_reference').notNull(),
  productName: text('product_name'),
  quantity: real('quantity').notNull().default(0),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sourcingRequests = sqliteTable('sourcing_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  round: integer('round').notNull().default(1),
  wholeDeliverable: integer('whole_deliverable', { mode: 'boolean' }).notNull().default(false),
  anonymous: integer('anonymous', { mode: 'boolean' }).notNull().default(false),
  currency: text('currency').notNull().default('USD'),
  dueDate: text('due_date'),
  budget: real('budget'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sourcingLines = sqliteTable('sourcing_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourcingRequestId: integer('sourcing_request_id').notNull(),
  sequence: integer('sequence').notNull().default(0),
  title: text('title').notNull(),
  description: text('description'),
  quantity: real('quantity').notNull().default(0),
  unit: text('unit').notNull(),
  awardedVendorReference: text('awarded_vendor_reference'),
  awardedAt: text('awarded_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sourcingInvites = sqliteTable('sourcing_invites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourcingRequestId: integer('sourcing_request_id').notNull(),
  vendorReference: text('vendor_reference').notNull(),
  round: integer('round').notNull().default(1),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorQuotes = sqliteTable('vendor_quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  sourcingRequestId: integer('sourcing_request_id').notNull(),
  vendorReference: text('vendor_reference').notNull(),
  round: integer('round').notNull().default(1),
  status: text('status').notNull().default('draft'),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  submittedAt: text('submitted_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorQuoteLines = sqliteTable('vendor_quote_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteReference: text('quote_reference').notNull(),
  lineId: integer('line_id').notNull(),
  unitPrice: real('unit_price').notNull().default(0),
  total: real('total').notNull().default(0),
});

export const vendorContracts = sqliteTable('vendor_contracts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  vendorReference: text('vendor_reference').notNull(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  url: text('url'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  verifiedBy: text('verified_by'),
  verifiedAt: text('verified_at'),
  uploadedBy: text('uploaded_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expires_at'),
});

export const vendorPayouts = sqliteTable('vendor_payouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  vendorReference: text('vendor_reference').notNull(),
  sourcingRequestReference: text('sourcing_request_reference'),
  deliverable: text('deliverable').notNull(),
  amount: real('amount').notNull().default(0),
  triggerType: text('trigger_type').notNull(),
  status: text('status').notNull().default('pending'),
  released: integer('released', { mode: 'boolean' }).notNull().default(false),
  releasedAt: text('released_at'),
  releasedBy: text('released_by'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorInvoices = sqliteTable('vendor_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  vendorReference: text('vendor_reference').notNull(),
  sourcingRequestReference: text('sourcing_request_reference'),
  status: text('status').notNull().default('draft'),
  currency: text('currency').notNull().default('USD'),
  subtotal: real('subtotal').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  taxPercent: real('tax_percent').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  issueDate: text('issue_date'),
  dueDate: text('due_date'),
  issuedAt: text('issued_at'),
  paidAt: text('paid_at'),
  voidedAt: text('voided_at'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorInvoiceLines = sqliteTable('vendor_invoice_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vendorInvoiceReference: text('vendor_invoice_reference').notNull(),
  sequence: integer('sequence').notNull().default(0),
  description: text('description'),
  amount: real('amount').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorInvoicePayments = sqliteTable('vendor_invoice_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vendorInvoiceReference: text('vendor_invoice_reference').notNull(),
  amount: real('amount').notNull().default(0),
  method: text('method'),
  reference: text('reference'),
  note: text('note'),
  paidAt: text('paid_at').notNull(),
  recordedBy: text('recorded_by').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorCreditNotes = sqliteTable('vendor_credit_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vendorInvoiceReference: text('vendor_invoice_reference').notNull(),
  amount: real('amount').notNull().default(0),
  reason: text('reason'),
  refundedAt: text('refunded_at').notNull(),
  recordedBy: text('recorded_by').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// QUALITY
// ============================================

export const qualityInspections = sqliteTable('quality_inspections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  productReference: text('product_reference'),
  vendorReference: text('vendor_reference'),
  purchaseOrderReference: text('purchase_order_reference'),
  inspector: text('inspector'),
  result: text('result'),
  notes: text('notes'),
  inspectionDate: text('inspection_date').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const nonConformanceReports = sqliteTable('non_conformance_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity').notNull().default('minor'),
  status: text('status').notNull().default('open'),
  inspectionReference: text('inspection_reference'),
  productReference: text('product_reference'),
  vendorReference: text('vendor_reference'),
  assignedTo: integer('assigned_to').references(() => people.id),
  resolution: text('resolution'),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// ASSETS
// ============================================

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  categoryId: integer('category_id').references(() => assetCategories.id),
  categoryName: text('category_name'),
  status: text('status').notNull().default('acquired'),
  purchasePrice: real('purchase_price').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  purchaseDate: text('purchase_date'),
  purchaseOrderReference: text('purchase_order_reference'),
  expenseReference: text('expense_reference'),
  serialNumber: text('serial_number'),
  model: text('model'),
  manufacturer: text('manufacturer'),
  warrantyExpiry: text('warranty_expiry'),
  assignedTo: integer('assigned_to').references(() => people.id),
  assignedToName: text('assigned_to_name'),
  assignedBranch: text('assigned_branch'),
  businessReference: text('business_reference'),
  businessName: text('business_name'),
  location: text('location'),
  conditionRating: integer('condition_rating').notNull().default(5),
  notes: text('notes'),
  // Depreciation fields
  depreciationRate: real('depreciation_rate').default(0),
  depreciationMethod: text('depreciation_method').default('straight_line'),
  accumulatedDepreciation: real('accumulated_depreciation').default(0),
  bookValue: real('book_value').default(0),
  // Disposal fields
  disposalDate: text('disposal_date'),
  disposalMethod: text('disposal_method'),
  disposalProceeds: real('disposal_proceeds').default(0),
  disposalCost: real('disposal_cost').default(0),
  disposalNotes: text('disposal_notes'),
  // Vendor relationship
  vendorReference: text('vendor_reference'),
  vendorName: text('vendor_name'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vendorRefIdx: index('assets_vendor_reference_idx').on(table.vendorReference),
  poRefIdx: index('assets_purchase_order_reference_idx').on(table.purchaseOrderReference),
  statusIdx: index('assets_status_idx').on(table.status),
}));

export const assetCategories = sqliteTable('asset_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  depreciationRate: real('depreciation_rate').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const assetAssignments = sqliteTable('asset_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetId: integer('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  assignedTo: integer('assigned_to').references(() => people.id),
  assignedBranch: text('assigned_branch'),
  assignedFrom: text('assigned_from').notNull(),
  assignedUntil: text('assigned_until'),
  reason: text('reason'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  assetIdIdx: index('asset_assignments_asset_id_idx').on(table.assetId),
}));

export const assetMaintenance = sqliteTable('asset_maintenance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetId: integer('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  maintenanceType: text('maintenance_type').notNull().default('repair'),
  description: text('description').notNull(),
  cost: real('cost').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  expenseReference: text('expense_reference'),
  performedOn: text('performed_on').notNull(),
  performedBy: text('performed_by'),
  nextDue: text('next_due'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  assetIdIdx: index('asset_maintenance_asset_id_idx').on(table.assetId),
}));

// ============================================
// EMPLOYEES & HR
// ============================================

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  personId: integer('person_id').references(() => people.id),
  employeeNumber: text('employee_number'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  department: text('department'),
  position: text('position'),
  employmentType: text('employment_type').notNull().default('full_time'),
  classification: text('classification').notNull(),
  hireDate: text('hire_date'),
  terminationDate: text('termination_date'),
  status: text('status').notNull().default('active'),
  baseSalary: real('base_salary').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  managerId: integer('manager_id'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeReference: text('employee_reference').notNull(),
  date: text('date').notNull(),
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  status: text('status').notNull().default('present'),
  hoursWorked: real('hours_worked').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  employeeDateIdx: uniqueIndex('attendance_employee_date_idx').on(table.employeeReference, table.date),
}));

export const payroll = sqliteTable('payroll', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  employeeReference: text('employee_reference').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  baseSalary: real('base_salary').notNull().default(0),
  allowances: real('allowances').notNull().default(0),
  deductions: real('deductions').notNull().default(0),
  tax: real('tax').notNull().default(0),
  netPay: real('net_pay').notNull().default(0),
  status: text('status').notNull().default('draft'),
  paidAt: text('paid_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('planning'),
  priority: text('priority').notNull().default('medium'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  budget: real('budget').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  managerId: integer('manager_id').references(() => people.id),
  managerName: text('manager_name'),
  customerReference: text('customer_reference'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const projectMilestones = sqliteTable('project_milestones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectReference: text('project_reference').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('due_date'),
  status: text('status').notNull().default('pending'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const timeEntries = sqliteTable('time_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  employeeReference: text('employee_reference').notNull(),
  projectReference: text('project_reference'),
  taskReference: text('task_reference'),
  date: text('date').notNull(),
  hours: real('hours').notNull().default(0),
  description: text('description'),
  billable: integer('billable', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const resourceAllocations = sqliteTable('resource_allocations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  employeeReference: text('employee_reference').notNull(),
  projectReference: text('project_reference'),
  taskReference: text('task_reference'),
  allocationType: text('allocation_type').notNull().default('project'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  hoursPerWeek: real('hours_per_week').notNull().default(0),
  utilizationPercent: real('utilization_percent').notNull().default(0),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const resourceCapacity = sqliteTable('resource_capacity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeReference: text('employee_reference').notNull(),
  date: text('date').notNull(),
  availableHours: real('available_hours').notNull().default(0),
  allocatedHours: real('allocated_hours').notNull().default(0),
  leaveHours: real('leave_hours').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  employeeDateIdx: uniqueIndex('resource_capacity_employee_date_idx').on(table.employeeReference, table.date),
}));

// ============================================
// AUTOMATION & WORKFLOWS
// ============================================

export const workflowRules = sqliteTable('workflow_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  triggerEvent: text('trigger_event').notNull(),
  conditions: text('conditions').notNull(),
  actions: text('actions').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const emailTemplates = sqliteTable('email_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const scheduledReports = sqliteTable('scheduled_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  reportType: text('report_type').notNull(),
  schedule: text('schedule').notNull(),
  recipients: text('recipients').notNull(),
  filters: text('filters').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastRun: text('last_run'),
  nextRun: text('next_run'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  entityType: text('entity_type'),
  entityReference: text('entity_reference'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflows = sqliteTable('workflows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  triggerType: text('trigger_type').notNull(),
  triggerConfig: text('trigger_config'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflowNodes = sqliteTable('workflow_nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workflowId: integer('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  type: text('type').notNull(),
  label: text('label').notNull(),
  config: text('config'),
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflowEdges = sqliteTable('workflow_edges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workflowId: integer('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  sourceNodeId: text('source_node_id').notNull(),
  targetNodeId: text('target_node_id').notNull(),
  sourceHandle: text('source_handle'),
  targetHandle: text('target_handle'),
  condition: text('condition'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflowExecutions = sqliteTable('workflow_executions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  workflowId: integer('workflow_id').notNull().references(() => workflows.id),
  workflowVersion: integer('workflow_version').notNull(),
  triggerType: text('trigger_type').notNull(),
  triggerData: text('trigger_data'),
  status: text('status').notNull().default('running'),
  currentNodeId: text('current_node_id'),
  contextData: text('context_data'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
  error: text('error'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workflowExecutionLogs = sqliteTable('workflow_execution_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  executionId: integer('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  nodeType: text('node_type').notNull(),
  status: text('status').notNull(),
  inputData: text('input_data'),
  outputData: text('output_data'),
  error: text('error'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
});

export const approvalChains = sqliteTable('approval_chains', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  entityType: text('entity_type').notNull(),
  entityReference: text('entity_reference'),
  status: text('status').notNull().default('pending'),
  currentStep: integer('current_step').notNull().default(0),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at'),
});

export const approvalSteps = sqliteTable('approval_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chainId: integer('chain_id').notNull().references(() => approvalChains.id, { onDelete: 'cascade' }),
  stepOrder: integer('step_order').notNull(),
  name: text('name').notNull(),
  approverType: text('approver_type').notNull(),
  approverId: integer('approver_id'),
  approverRole: text('approver_role'),
  status: text('status').notNull().default('pending'),
  decision: text('decision'),
  comment: text('comment'),
  decidedAt: text('decided_at'),
  slaHours: integer('sla_hours'),
  escalationEnabled: integer('escalation_enabled', { mode: 'boolean' }).notNull().default(false),
  escalationRecipientType: text('escalation_recipient_type'),
  escalationRecipientId: integer('escalation_recipient_id'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const slaRules = sqliteTable('sla_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  entityType: text('entity_type').notNull(),
  condition: text('condition'),
  slaHours: integer('sla_hours').notNull(),
  warningHours: integer('warning_hours'),
  escalationLevels: text('escalation_levels'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// PLATFORM
// ============================================

export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importJobs = sqliteTable('import_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  entityType: text('entity_type').notNull(),
  fileName: text('file_name').notNull(),
  status: text('status').notNull().default('pending'),
  totalRows: integer('total_rows').notNull().default(0),
  processedRows: integer('processed_rows').notNull().default(0),
  errorRows: integer('error_rows').notNull().default(0),
  errors: text('errors'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityReference: text('entity_reference').notNull(),
  action: text('action').notNull(),
  payload: text('payload').notNull(),
  status: text('status').notNull().default('pending'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const offlineSnapshots = sqliteTable('offline_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityReference: text('entity_reference').notNull(),
  data: text('data').notNull(),
  version: integer('version').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importMappings = sqliteTable('import_mappings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  fieldName: text('field_name').notNull(),
  csvColumn: text('csv_column').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  color: text('color').notNull(),
  entityType: text('entity_type'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const entityTags = sqliteTable('entity_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tagReference: text('tag_reference').notNull(),
  entityType: text('entity_type').notNull(),
  entityReference: text('entity_reference').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  entityIdx: index('entity_tags_entity_idx').on(table.entityType, table.entityReference),
  tagIdx: index('entity_tags_tag_idx').on(table.tagReference),
}));

// ============================================
// DASHBOARD
// ============================================

export const dashboardWidgets = sqliteTable('dashboard_widgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  config: text('config').notNull(),
  position: integer('position').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dashboardConfigs = sqliteTable('dashboard_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull().unique(),
  name: text('name').notNull(),
  layout: text('layout').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type LeadActivity = typeof leadActivities.$inferSelect;
export type NewLeadActivity = typeof leadActivities.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type CustomerActivity = typeof customerActivities.$inferSelect;
export type NewCustomerActivity = typeof customerActivities.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;

export type ProposalLine = typeof proposalLines.$inferSelect;
export type NewProposalLine = typeof proposalLines.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type BusinessBranch = typeof businessBranches.$inferSelect;
export type NewBusinessBranch = typeof businessBranches.$inferInsert;

export type BusinessCommunication = typeof businessCommunications.$inferSelect;
export type NewBusinessCommunication = typeof businessCommunications.$inferInsert;

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;

export type HelpdeskTicket = typeof helpdeskTickets.$inferSelect;
export type NewHelpdeskTicket = typeof helpdeskTickets.$inferInsert;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type NewTicketMessage = typeof ticketMessages.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type CashAccount = typeof cashAccounts.$inferSelect;
export type NewCashAccount = typeof cashAccounts.$inferInsert;

export type CashTransaction = typeof cashTransactions.$inferSelect;
export type NewCashTransaction = typeof cashTransactions.$inferInsert;

export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

export type FinancialReport = typeof financialReports.$inferSelect;
export type NewFinancialReport = typeof financialReports.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type NewInventoryAdjustment = typeof inventoryAdjustments.$inferInsert;

export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type NewGoodsReceipt = typeof goodsReceipts.$inferInsert;

export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type NewGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;

export type SourcingRequest = typeof sourcingRequests.$inferSelect;
export type NewSourcingRequest = typeof sourcingRequests.$inferInsert;

export type SourcingLine = typeof sourcingLines.$inferSelect;
export type NewSourcingLine = typeof sourcingLines.$inferInsert;

export type SourcingInvite = typeof sourcingInvites.$inferSelect;
export type NewSourcingInvite = typeof sourcingInvites.$inferInsert;

export type VendorQuote = typeof vendorQuotes.$inferSelect;
export type NewVendorQuote = typeof vendorQuotes.$inferInsert;

export type VendorQuoteLine = typeof vendorQuoteLines.$inferSelect;
export type NewVendorQuoteLine = typeof vendorQuoteLines.$inferInsert;

export type VendorContract = typeof vendorContracts.$inferSelect;
export type NewVendorContract = typeof vendorContracts.$inferInsert;

export type VendorPayout = typeof vendorPayouts.$inferSelect;
export type NewVendorPayout = typeof vendorPayouts.$inferInsert;

export type VendorInvoice = typeof vendorInvoices.$inferSelect;
export type NewVendorInvoice = typeof vendorInvoices.$inferInsert;

export type VendorInvoiceLine = typeof vendorInvoiceLines.$inferSelect;
export type NewVendorInvoiceLine = typeof vendorInvoiceLines.$inferInsert;

export type VendorInvoicePayment = typeof vendorInvoicePayments.$inferSelect;
export type NewVendorInvoicePayment = typeof vendorInvoicePayments.$inferInsert;

export type VendorCreditNote = typeof vendorCreditNotes.$inferSelect;
export type NewVendorCreditNote = typeof vendorCreditNotes.$inferInsert;

export type QualityInspection = typeof qualityInspections.$inferSelect;
export type NewQualityInspection = typeof qualityInspections.$inferInsert;

export type NonConformanceReport = typeof nonConformanceReports.$inferSelect;
export type NewNonConformanceReport = typeof nonConformanceReports.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type AssetCategory = typeof assetCategories.$inferSelect;
export type NewAssetCategory = typeof assetCategories.$inferInsert;

export type AssetAssignment = typeof assetAssignments.$inferSelect;
export type NewAssetAssignment = typeof assetAssignments.$inferInsert;

export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type NewAssetMaintenance = typeof assetMaintenance.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type Payroll = typeof payroll.$inferSelect;
export type NewPayroll = typeof payroll.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type NewProjectMilestone = typeof projectMilestones.$inferInsert;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;

export type ResourceAllocation = typeof resourceAllocations.$inferSelect;
export type NewResourceAllocation = typeof resourceAllocations.$inferInsert;

export type ResourceCapacity = typeof resourceCapacity.$inferSelect;
export type NewResourceCapacity = typeof resourceCapacity.$inferInsert;

export type WorkflowRule = typeof workflowRules.$inferSelect;
export type NewWorkflowRule = typeof workflowRules.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type NewWorkflowNode = typeof workflowNodes.$inferInsert;

export type WorkflowEdge = typeof workflowEdges.$inferSelect;
export type NewWorkflowEdge = typeof workflowEdges.$inferInsert;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;

export type WorkflowExecutionLog = typeof workflowExecutionLogs.$inferSelect;
export type NewWorkflowExecutionLog = typeof workflowExecutionLogs.$inferInsert;

export type ApprovalChain = typeof approvalChains.$inferSelect;
export type NewApprovalChain = typeof approvalChains.$inferInsert;

export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type NewApprovalStep = typeof approvalSteps.$inferInsert;

export type SlaRule = typeof slaRules.$inferSelect;
export type NewSlaRule = typeof slaRules.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type ImportJob = typeof importJobs.$inferSelect;
export type NewImportJob = typeof importJobs.$inferInsert;

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;

export type OfflineSnapshot = typeof offlineSnapshots.$inferSelect;
export type NewOfflineSnapshot = typeof offlineSnapshots.$inferInsert;

export type ImportMapping = typeof importMappings.$inferSelect;
export type NewImportMapping = typeof importMappings.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type EntityTag = typeof entityTags.$inferSelect;
export type NewEntityTag = typeof entityTags.$inferInsert;

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type NewDashboardWidget = typeof dashboardWidgets.$inferInsert;

export type DashboardConfig = typeof dashboardConfigs.$inferSelect;
export type NewDashboardConfig = typeof dashboardConfigs.$inferInsert;