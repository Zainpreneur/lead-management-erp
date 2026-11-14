export type LeadStage = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost' | 'archived';
export type LeadPriority = 'hot' | 'warm' | 'cold';
export type LeadSource = 'google_maps' | 'referral' | 'inbound' | 'cold_call' | 'cold_email' | 'linkedin' | 'trade_show' | 'website' | 'social' | 'other';

export interface LeadActivity {
  id: number;
  kind: string;
  summary: string;
  outcome: string | null;
  actor: string;
  createdAt: string;
}

export interface Lead {
  id: number;
  reference: string;
  name: string;
  category: string | null;
  city: string | null;
  country: string | null;
  source: string;
  stage: string;
  priority: string;
  score: number;
  estimatedValue: number;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  social: Record<string, string>;
  notes: string | null;
  assignedTo: number | null;
  assignedTeam: string | null;
  assignedToName: string | null;
  followUpDate: string | null;
  lastContactedAt: string | null;
  reminderDays: number;
  convertedAt: string | null;
  lostReason: string | null;
  nextStages: string[];
  activities: LeadActivity[];
  converted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSummary {
  total: number;
  open: number;
  won: number;
  lost: number;
  archived: number;
  pipelineValue: number;
  byStage: Record<string, { count: number; value: number }>;
  bySource: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface LeadInput {
  name: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  source?: string;
  stage?: string;
  priority?: string;
  estimatedValue?: number;
  score?: number;
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  social?: Record<string, string>;
  notes?: string | null;
  assignedTo?: number | null;
  assignedTeam?: string | null;
  followUpDate?: string | null;
  reminderDays?: number;
}

export interface ListFilters {
  search?: string;
  stage?: string;
  source?: string;
  assignedTo?: number;
  priority?: string;
  limit?: number;
  page?: number;
}

export interface Person {
  id: number;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  team: string;
  role: string;
  isActive: boolean;
}

export const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
};

export const PRIORITY_LABELS: Record<string, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

export const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Google Maps',
  referral: 'Referral',
  inbound: 'Inbound',
  cold_call: 'Cold Call',
  cold_email: 'Cold Email',
  linkedin: 'LinkedIn',
  trade_show: 'Trade Show',
  website: 'Website',
  social: 'Social',
  other: 'Other',
};

export const STAGE_FLOW: Record<string, string[]> = {
  new: ['contacted', 'qualified', 'lost', 'archived'],
  contacted: ['qualified', 'quoted', 'lost', 'archived'],
  qualified: ['quoted', 'won', 'lost', 'archived'],
  quoted: ['won', 'lost', 'archived'],
  won: ['archived'],
  lost: ['new', 'archived'],
  archived: ['new'],
};

export type CustomerStatus = 'active' | 'paused' | 'churned' | 'archived';

export interface CustomerActivity {
  id: number;
  customerReference: string;
  kind: string;
  summary: string;
  outcome: string | null;
  actor: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  reference: string;
  leadId: number | null;
  leadReference: string | null;
  name: string;
  category: string | null;
  city: string | null;
  country: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  social: Record<string, string>;
  notes: string | null;
  assignedTo: number | null;
  assignedTeam: string | null;
  assignedToName: string | null;
  status: string;
  mrr: number;
  totalValue: number;
  firstConvertedAt: string;
  lastActivityAt: string | null;
  activities: CustomerActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  total: number;
  active: number;
  paused: number;
  churned: number;
  archived: number;
  totalMrr: number;
  totalValue: number;
  byStatus: Record<string, number>;
}

export interface CustomerInput {
  name: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  social?: Record<string, string>;
  notes?: string | null;
  assignedTo?: number | null;
  assignedTeam?: string | null;
  status?: string;
  mrr?: number;
  totalValue?: number;
  leadReference?: string | null;
}

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  churned: 'Churned',
  archived: 'Archived',
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';

export interface InvoiceLineItem {
  id: number;
  invoiceReference: string;
  productReference: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  reference: string;
  customerReference: string;
  customerName: string;
  leadReference: string | null;
  proposalReference: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  notes: string | null;
  terms: string | null;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummary {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  void: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface InvoiceInput {
  customerReference: string;
  leadReference?: string | null;
  proposalReference?: string | null;
  status?: string | null;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  currency?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  paidDate?: string | null;
  notes?: string | null;
  terms?: string | null;
  lineItems?: Array<{
    productReference?: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxRate?: number;
  }>;
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  void: 'Void',
};
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: number;
  reference: string;
  invoiceReference: string;
  customerReference: string | null;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentInput {
  invoiceReference: string;
  amount: number;
  method?: string;
  status?: string;
  paidAt?: string | null;
  notes?: string | null;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  online: 'Online',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
};

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface ProposalLine {
  id: number;
  proposalReference: string;
  productReference: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface Proposal {
  id: number;
  reference: string;
  leadReference: string | null;
  customerReference: string | null;
  title: string;
  status: string;
  subtotal: number;
  discountType: string | null;
  discountValue: number;
  total: number;
  currency: string;
  validUntil: string | null;
  notes: string | null;
  lines: ProposalLine[];
  createdAt: string;
  updatedAt: string;
}

export interface ProposalInput {
  leadReference?: string | null;
  customerReference?: string | null;
  title: string;
  status?: string;
  subtotal?: number;
  discountType?: string | null;
  discountValue?: number;
  total?: number;
  currency?: string;
  validUntil?: string | null;
  notes?: string | null;
  lines?: Array<{ productReference?: string | null; description: string; quantity: number; unitPrice: number }>;
}

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  relatedType: string | null;
  relatedReference: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  assignedTo: number | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  relatedType?: string | null;
  relatedReference?: string | null;
  dueDate?: string | null;
  status?: string;
  priority?: string;
  assignedTo?: number | null;
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export interface Product {
  id: number;
  reference: string;
  name: string;
  sku: string | null;
  type: string;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  reference: string;
  customerReference: string | null;
  accountName: string | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityReference: string;
  action: string;
  actor: string;
  details: string | null;
  createdAt: string;
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Expense {
  id: number;
  reference: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  expenseDate: string;
  paidBy: string | null;
  notes: string | null;
  receiptUrl: string | null;
  vendorReference: string | null;
  assetReference: string | null;
  purchaseOrderReference: string | null;
  assetCategory: string | null;
  isAssetPurchase: boolean;
  assetDepreciationReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  title: string;
  category?: string;
  amount: number;
  currency?: string;
  status?: string;
  expenseDate?: string;
  paidBy?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  vendorReference?: string | null;
  assetReference?: string | null;
  purchaseOrderReference?: string | null;
  assetCategory?: string | null;
  isAssetPurchase?: boolean;
  assetDepreciationReference?: string | null;
}

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  travel: 'Travel',
  meals: 'Meals',
  office: 'Office Supplies',
  software: 'Software',
  marketing: 'Marketing',
  training: 'Training',
  asset_purchase: 'Asset Purchase',
  asset_maintenance: 'Asset Maintenance',
  asset_disposal: 'Asset Disposal',
  asset_depreciation: 'Asset Depreciation',
  other: 'Other',
};

export type BusinessTier = 'vip' | 'premium' | 'standard' | 'basic';
export type BusinessRelationship = 'client' | 'equity' | 'owned';
export type CommunicationKind = 'call' | 'email' | 'meeting' | 'site_visit' | 'letter' | 'other';

export interface BusinessBranch {
  id: number;
  reference: string;
  businessReference: string;
  code: string | null;
  name: string;
  kind: string;
  status: string;
  location: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCommunication {
  id: number;
  businessReference: string;
  contactId: number | null;
  kind: CommunicationKind;
  subject: string;
  body: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface BusinessDetail {
  id: number;
  reference: string;
  name: string;
  code: string;
  relationship: BusinessRelationship;
  relationships: BusinessRelationship[];
  industry: string | null;
  contact: { name: string | null; role: string | null; email: string | null; phone: string | null };
  location: { city: string | null; country: string | null };
  status: string;
  notes: string | null;
  tags: string[];
  tier?: BusinessTier;
  healthScore?: number;
  billedAmount?: number;
  counts?: { branches: number; activeBranches: number; requests: number; openTickets: number; lifetimeValue: number };
  branches: BusinessBranch[];
  communications: BusinessCommunication[];
  createdAt: string;
}

export type RequestStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed' | 'Cancelled';
export type TicketStatus = 'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ServiceRequest {
  id: number;
  reference: string;
  businessReference: string | null;
  title: string;
  status: string;
  priority: string;
  requestedBy: string;
  contactName: string | null;
  contactEmail: string | null;
  contactRole: string | null;
  assignedTeam: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  requiredDate: string | null;
  specialRequirements: string | null;
  finalAmount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestInput {
  businessReference?: string | null;
  title: string;
  status?: string;
  priority?: string;
  requestedBy?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactRole?: string | null;
  assignedTeam?: string | null;
  assignedTo?: number | null;
  requiredDate?: string | null;
  specialRequirements?: string | null;
  finalAmount?: number;
  currency?: string;
  notes?: string | null;
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  Approved: 'Approved',
  Rejected: 'Rejected',
  'In Progress': 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

export const REQUEST_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export interface HelpdeskTicket {
  id: number;
  reference: string;
  businessReference: string | null;
  serviceRequestReference: string | null;
  subject: string;
  description: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  assignedTeam: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  resolution: string | null;
  resolutionSummary: string | null;
  slaDueAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: number;
  ticketReference: string;
  author: string;
  authorRole: string;
  visibility: string;
  body: string;
  createdAt: string;
}

export interface TicketInput {
  businessReference?: string | null;
  serviceRequestReference?: string | null;
  subject: string;
  description: string;
  type?: string;
  category?: string;
  priority?: string;
  status?: string;
  assignedTeam?: string | null;
  assignedTo?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  resolution?: string | null;
}

export const TICKET_STATUS_LABELS: Record<string, string> = {
  New: 'New',
  Open: 'Open',
  'In Progress': 'In Progress',
  Pending: 'Pending',
  Resolved: 'Resolved',
  Closed: 'Closed',
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export type CashAccountType = 'bank' | 'cash' | 'credit_card' | 'savings';
export type CashTransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'receipt';

export interface CashAccount {
  id: number;
  reference: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  accountNumber: string | null;
  bankName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction {
  id: number;
  reference: string;
  accountReference: string;
  type: string;
  amount: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  reconciled: boolean;
  transactionDate: string;
  createdAt: string;
}



export const CASH_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: 'Bank Account',
  cash: 'Cash',
  credit_card: 'Credit Card',
  savings: 'Savings',
};

export const CASH_TRANSACTION_TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
  payment: 'Payment',
  receipt: 'Receipt',
};

export interface TaxRate {
  id: number;
  reference: string;
  name: string;
  rate: number;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TAX_TYPE_LABELS: Record<string, string> = {
  vat: 'VAT',
  gst: 'GST',
  sales_tax: 'Sales Tax',
  service_tax: 'Service Tax',
  excise: 'Excise Duty',
  custom: 'Custom',
};

export interface Document {
  id: number;
  reference: string;
  name: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  entityType: string;
  entityReference: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInput {
  name: string;
  fileName: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  entityType: string;
  entityReference: string;
  uploadedBy?: string | null;
}

export interface Vendor {
  id: number;
  reference: string;
  name: string;
  code: string | null;
  kind: string;
  status: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  notes: string | null;
  rating: number | null;
  // Scorecard fields
  onTimeDeliveryRate: number;
  defectRate: number;
  responsivenessScore: number;
  overallScore: number;
  financialRisk: 'low' | 'medium' | 'high';
  operationalRisk: 'low' | 'medium' | 'high';
  complianceRisk: 'low' | 'medium' | 'high';
  lastAssessed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorInput {
  name: string;
  code?: string | null;
  kind?: string;
  status?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  rating?: number | null;
}





export interface PurchaseOrder {
  id: number;
  reference: string;
  vendorReference: string;
  vendorName: string;
  status: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDelivery: string | null;
  notes: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  poReference: string;
  productReference: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  receivedQuantity: number;
  sortOrder: number;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
}

export interface PurchaseOrderInput {
  vendorReference: string;
  status?: string;
  currency?: string;
  orderDate?: string;
  expectedDelivery?: string | null;
  notes?: string | null;
  items?: Array<{ productReference?: string | null; description: string; quantity: number; unitPrice: number; serialNumber?: string | null; model?: string | null; manufacturer?: string | null }>;
}



export interface InventoryAdjustment {
  id: number;
  reference: string;
  productReference: string;
  type: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export const VENDOR_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  blacklisted: 'Blacklisted',
};

export const VENDOR_KIND_LABELS: Record<string, string> = {
  supplier: 'Supplier',
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  service_provider: 'Service Provider',
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  ordered: 'Ordered',
  received: 'Received',
  partially_received: 'Partially Received',
  cancelled: 'Cancelled',
};

export const INVENTORY_ADJUSTMENT_TYPE_LABELS: Record<string, string> = {
  adjustment: 'Adjustment',
  receipt: 'Receipt',
  issue: 'Issue',
  transfer: 'Transfer',
  return: 'Return',
};

export interface QualityInspection {
  id: number;
  reference: string;
  title: string;
  type: string;
  status: string;
  productReference: string | null;
  vendorReference: string | null;
  purchaseOrderReference: string | null;
  inspector: string | null;
  result: string | null;
  notes: string | null;
  inspectionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityInspectionInput {
  title: string;
  type?: string;
  status?: string;
  productReference?: string | null;
  vendorReference?: string | null;
  purchaseOrderReference?: string | null;
  inspector?: string | null;
  result?: string | null;
  notes?: string | null;
  inspectionDate?: string;
}





export interface NonConformanceReport {
  id: number;
  reference: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  inspectionReference: string | null;
  productReference: string | null;
  vendorReference: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NCRInput {
  title: string;
  description: string;
  severity?: string;
  status?: string;
  inspectionReference?: string | null;
  productReference?: string | null;
  vendorReference?: string | null;
  assignedTo?: number | null;
  resolution?: string | null;
}





export interface QualityInspection {
  id: number;
  reference: string;
  title: string;
  type: string;
  status: string;
  productReference: string | null;
  vendorReference: string | null;
  purchaseOrderReference: string | null;
  inspector: string | null;
  result: string | null;
  notes: string | null;
  inspectionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityInspectionInput {
  title: string;
  type?: string;
  status?: string;
  productReference?: string | null;
  vendorReference?: string | null;
  purchaseOrderReference?: string | null;
  inspector?: string | null;
  result?: string | null;
  notes?: string | null;
  inspectionDate?: string;
}

export const INSPECTION_TYPE_LABELS: Record<string, string> = {
  incoming: 'Incoming',
  in_process: 'In-Process',
  final: 'Final',
  audit: 'Audit',
};

export const INSPECTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  passed: 'Passed',
  failed: 'Failed',
  conditional: 'Conditional',
};

export interface NonConformanceReport {
  id: number;
  reference: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  inspectionReference: string | null;
  productReference: string | null;
  vendorReference: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NCRInput {
  title: string;
  description: string;
  severity?: string;
  status?: string;
  inspectionReference?: string | null;
  productReference?: string | null;
  vendorReference?: string | null;
  assignedTo?: number | null;
  resolution?: string | null;
}

export const NCR_SEVERITY_LABELS: Record<string, string> = {
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical',
};

export const NCR_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
};

export interface Employee {
  id: number;
  reference: string;
  personId: number | null;
  employeeNumber: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  employmentType: string;
  classification: string;
  hireDate: string | null;
  terminationDate: string | null;
  status: string;
  baseSalary: number;
  currency: string;
  managerId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  personId?: number | null;
  employeeNumber?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string;
  classification?: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  status?: string;
  baseSalary?: number;
  currency?: string;
  managerId?: number | null;
  notes?: string | null;
}





export interface Attendance {
  id: number;
  employeeReference: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hoursWorked: number;
  notes: string | null;
  createdAt: string;
}

export interface Payroll {
  id: number;
  reference: string;
  employeeReference: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}



export interface Project {
  id: number;
  reference: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  currency: string;
  managerId: number | null;
  managerName: string | null;
  customerReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  status?: string;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  currency?: string;
  managerId?: number | null;
  customerReference?: string | null;
}



export interface ProjectMilestone {
  id: number;
  projectReference: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

export interface TimeEntry {
  id: number;
  reference: string;
  employeeReference: string;
  projectReference: string | null;
  taskReference: string | null;
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  createdAt: string;
}

export interface TimeEntryInput {
  employeeReference: string;
  projectReference?: string | null;
  taskReference?: string | null;
  date: string;
  hours: number;
  description?: string | null;
  billable?: boolean;
}

export interface Employee {
  id: number;
  reference: string;
  personId: number | null;
  employeeNumber: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  employmentType: string;
  classification: string;
  hireDate: string | null;
  terminationDate: string | null;
  status: string;
  baseSalary: number;
  currency: string;
  managerId: number | null;
  managerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  personId?: number | null;
  employeeNumber?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string;
  classification?: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  status?: string;
  baseSalary?: number;
  currency?: string;
  managerId?: number | null;
  notes?: string | null;
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  terminated: 'Terminated',
  suspended: 'Suspended',
};

export interface Project {
  id: number;
  reference: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  currency: string;
  managerId: number | null;
  managerName: string | null;
  customerReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  status?: string;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  currency?: string;
  managerId?: number | null;
  customerReference?: string | null;
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export interface ProjectMilestone {
  id: number;
  projectReference: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

export interface TimeEntry {
  id: number;
  reference: string;
  employeeReference: string;
  projectReference: string | null;
  taskReference: string | null;
  date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  createdAt: string;
}

export interface TimeEntryInput {
  employeeReference: string;
  projectReference?: string | null;
  taskReference?: string | null;
  date: string;
  hours: number;
  description?: string | null;
  billable?: boolean;
}

export interface Attendance {
  id: number;
  employeeReference: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hoursWorked: number;
  notes: string | null;
  createdAt: string;
}

export interface Payroll {
  id: number;
  reference: string;
  employeeReference: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PAYROLL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  processed: 'Processed',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export interface DashboardWidget {
  id: number;
  reference: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRule {
  id: number;
  reference: string;
  name: string;
  triggerEvent: string;
  conditions: unknown[];
  actions: unknown[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: number;
  reference: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: number;
  reference: string;
  name: string;
  reportType: string;
  schedule: string;
  recipients: string[];
  filters: Record<string, unknown>;
  isActive: boolean;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  reference: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityReference: string | null;
  isRead: boolean;
  createdAt: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

export const WORKFLOW_TRIGGER_LABELS: Record<string, string> = {
  lead_created: 'Lead Created',
  lead_stage_changed: 'Lead Stage Changed',
  customer_created: 'Customer Created',
  invoice_created: 'Invoice Created',
  invoice_paid: 'Invoice Paid',
  expense_submitted: 'Expense Submitted',
  ticket_created: 'Ticket Created',
};

export interface Tenant {
  id: number;
  reference: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImportJob {
  id: number;
  reference: string;
  entityType: string;
  fileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors: string | null;
  createdAt: string;
  updatedAt: string;
}

export const IMPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  partial: 'Partial',
};

export interface SyncQueueItem {
  id: number;
  entityType: string;
  entityReference: string;
  action: string;
  payload: Record<string, unknown>;
  status: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineSnapshot {
  id: number;
  entityType: string;
  entityReference: string;
  data: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStats {
  pending: number;
  failed: number;
  processed: number;
  snapshots: number;
}

export interface ResourceAllocation {
  id: number;
  reference: string;
  employeeReference: string;
  projectReference: string | null;
  taskReference: string | null;
  allocationType: string;
  startDate: string;
  endDate: string | null;
  hoursPerWeek: number;
  utilizationPercent: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAllocationInput {
  employeeReference: string;
  projectReference?: string | null;
  taskReference?: string | null;
  allocationType?: string;
  startDate: string;
  endDate?: string | null;
  hoursPerWeek?: number;
  utilizationPercent?: number;
  status?: string;
  notes?: string | null;
}

export interface ResourceCapacity {
  id: number;
  employeeReference: string;
  date: string;
  availableHours: number;
  allocatedHours: number;
  leaveHours: number;
  notes: string | null;
  createdAt: string;
}





export interface ResourceAllocation {
  id: number;
  reference: string;
  employeeReference: string;
  projectReference: string | null;
  taskReference: string | null;
  allocationType: string;
  startDate: string;
  endDate: string | null;
  hoursPerWeek: number;
  utilizationPercent: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAllocationInput {
  employeeReference: string;
  projectReference?: string | null;
  taskReference?: string | null;
  allocationType?: string;
  startDate: string;
  endDate?: string | null;
  hoursPerWeek?: number;
  utilizationPercent?: number;
  status?: string;
  notes?: string | null;
}

export interface ResourceCapacity {
  id: number;
  employeeReference: string;
  date: string;
  availableHours: number;
  allocatedHours: number;
  leaveHours: number;
  notes: string | null;
  createdAt: string;
}

export const ALLOCATION_TYPE_LABELS: Record<string, string> = {
  project: 'Project',
  task: 'Task',
  leave: 'Leave',
  training: 'Training',
  bench: 'Bench',
};

export const ALLOCATION_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'User',
  viewer: 'Viewer',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  manager: ['leads:read', 'leads:write', 'customers:read', 'customers:write', 'invoices:read', 'invoices:write', 'expenses:read', 'expenses:write', 'reports:read', 'tasks:read', 'tasks:write'],
  user: ['leads:read', 'leads:write', 'customers:read', 'customers:write', 'invoices:read', 'tasks:read', 'tasks:write'],
  viewer: ['leads:read', 'customers:read', 'invoices:read', 'reports:read', 'tasks:read'],
};

export interface Tag {
  id: number;
  reference: string;
  name: string;
  slug: string;
  color: string;
  entityType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagInput {
  name: string;
  slug?: string;
  color?: string;
  entityType?: string | null;
}

export interface EntityTag {
  id: number;
  tagReference: string;
  entityType: string;
  entityReference: string;
  createdAt: string;
}

export interface Tag {
  id: number;
  reference: string;
  name: string;
  slug: string;
  color: string;
  entityType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagInput {
  name: string;
  slug?: string;
  color?: string;
  entityType?: string | null;
}

export interface EntityTag {
  id: number;
  tagReference: string;
  entityType: string;
  entityReference: string;
  createdAt: string;
}

export interface Asset {
  id: number;
  reference: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  status: string;
  purchasePrice: number;
  currency: string;
  purchaseDate: string | null;
  purchaseOrderReference: string | null;
  expenseReference: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  warrantyExpiry: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  assignedBranch: string | null;
  businessReference: string | null;
  businessName: string | null;
  location: string | null;
  conditionRating: number;
  notes: string | null;
  open: boolean;
  terminal: boolean;
  createdAt: string;
  updatedAt: string;
  // Depreciation fields
  depreciationRate: number;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  accumulatedDepreciation: number;
  bookValue: number;
  // Disposal fields
  disposalDate: string | null;
  disposalMethod: 'sale' | 'scrap' | 'donation' | 'trade_in' | null;
  disposalProceeds: number;
  disposalCost: number;
  disposalNotes: string | null;
  // Vendor relationship
  vendorReference: string | null;
  vendorName: string | null;
}

export interface AssetInput {
  name: string;
  categoryId?: number | null;
  status?: string;
  purchasePrice?: number;
  currency?: string;
  purchaseDate?: string | null;
  purchaseOrderReference?: string | null;
  expenseReference?: string | null;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  warrantyExpiry?: string | null;
  assignedTo?: number | null;
  assignedBranch?: string | null;
  businessReference?: string | null;
  location?: string | null;
  conditionRating?: number;
  notes?: string | null;
  // Depreciation fields
  depreciationRate?: number;
  depreciationMethod?: 'straight_line' | 'declining_balance' | 'units_of_production';
  // Disposal fields (for disposal workflow)
  disposalDate?: string | null;
  disposalMethod?: 'sale' | 'scrap' | 'donation' | 'trade_in';
  disposalProceeds?: number;
  disposalCost?: number;
  disposalNotes?: string | null;
  disposalVendorRef?: string | null;
  // Vendor relationship
  vendorReference?: string | null;
  vendorName?: string | null;
}

export interface AssetCategory {
  id: number;
  reference: string;
  name: string;
  code: string | null;
  description: string | null;
  depreciationRate: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}



export const ASSET_MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  repair: 'Repair',
  inspection: 'Inspection',
  upgrade: 'Upgrade',
  cleaning: 'Cleaning',
  calibration: 'Calibration',
};

export interface AssetMaintenance {
  id: number;
  assetId: number;
  maintenanceType: string;
  description: string;
  cost: number;
  currency: string;
  expenseReference: string | null;
  performedOn: string;
  performedBy: string | null;
  nextDue: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Asset {
  id: number;
  reference: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  status: string;
  purchasePrice: number;
  currency: string;
  purchaseDate: string | null;
  purchaseOrderReference: string | null;
  expenseReference: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  warrantyExpiry: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  assignedBranch: string | null;
  businessReference: string | null;
  businessName: string | null;
  location: string | null;
  conditionRating: number;
  notes: string | null;
  open: boolean;
  terminal: boolean;
  createdAt: string;
  updatedAt: string;
  // Depreciation fields
  depreciationRate: number;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
  accumulatedDepreciation: number;
  bookValue: number;
  // Disposal fields
  disposalDate: string | null;
  disposalMethod: 'sale' | 'scrap' | 'donation' | 'trade_in' | null;
  disposalProceeds: number;
  disposalCost: number;
  disposalNotes: string | null;
  // Vendor relationship
  vendorReference: string | null;
  vendorName: string | null;
}

export interface AssetInput {
  name: string;
  categoryId?: number | null;
  status?: string;
  purchasePrice?: number;
  currency?: string;
  purchaseDate?: string | null;
  purchaseOrderReference?: string | null;
  expenseReference?: string | null;
  serialNumber?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  warrantyExpiry?: string | null;
  assignedTo?: number | null;
  assignedBranch?: string | null;
  businessReference?: string | null;
  location?: string | null;
  conditionRating?: number;
  notes?: string | null;
  // Depreciation fields
  depreciationRate?: number;
  depreciationMethod?: 'straight_line' | 'declining_balance' | 'units_of_production';
  // Disposal fields (for disposal workflow)
  disposalDate?: string | null;
  disposalMethod?: 'sale' | 'scrap' | 'donation' | 'trade_in';
  disposalProceeds?: number;
  disposalCost?: number;
  disposalNotes?: string | null;
  disposalVendorRef?: string | null;
  // Vendor relationship
  vendorReference?: string | null;
  vendorName?: string | null;
}

export interface AssetCategory {
  id: number;
  reference: string;
  name: string;
  code: string | null;
  description: string | null;
  depreciationRate: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ASSET_STATUS_LABELS: Record<string, string> = {
  acquired: 'Acquired',
  deployed: 'Deployed',
  maintaining: 'Maintaining',
  disposed: 'Disposed',
  lost: 'Lost',
};

export interface AssetMaintenance {
  id: number;
  assetId: number;
  maintenanceType: string;
  description: string;
  cost: number;
  currency: string;
  expenseReference: string | null;
  performedOn: string;
  performedBy: string | null;
  nextDue: string | null;
  notes: string | null;
  createdAt: string;
}


export interface GoodsReceiptItem {
  id: number;
  receiptReference: string;
  poItemId: number;
  productReference: string | null;
  description: string;
  quantityReceived: number;
  unitPrice: number;
  sortOrder: number;
}

export interface GoodsReceipt {
  id: number;
  reference: string;
  poReference: string;
  vendorReference: string | null;
  receivedDate: string;
  receivedBy: string | null;
  notes: string | null;
  items: GoodsReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptInput {
  poReference: string;
  receivedDate?: string;
  receivedBy?: string | null;
  notes?: string | null;
  items: Array<{ poItemId: number; quantityReceived: number }>;
}


export interface StockTransfer {
  id: number;
  reference: string;
  fromLocation: string;
  toLocation: string;
  productReference: string;
  productName: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferInput {
  fromLocation: string;
  toLocation: string;
  productReference: string;
  quantity: number;
  notes?: string | null;
  createdBy?: string | null;
}

export const STOCK_TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};


export interface SourcingLine {
  id: number;
  sourcingRequestId: number;
  sequence: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  awardedVendorReference: string | null;
  awardedAt: string | null;
}

export interface SourcingRequest {
  id: number;
  reference: string;
  title: string;
  status: string;
  round: number;
  wholeDeliverable: boolean;
  anonymous: boolean;
  currency: string;
  dueDate: string | null;
  budget: number | null;
  notes: string | null;
  createdBy: string;
  lines: SourcingLine[];
  createdAt: string;
  updatedAt: string;
}

export interface SourcingRequestInput {
  title: string;
  wholeDeliverable?: boolean;
  anonymous?: boolean;
  currency?: string;
  dueDate?: string | null;
  budget?: number | null;
  notes?: string | null;
  createdBy?: string;
  lines?: Array<{ title: string; description?: string | null; quantity?: number; unit?: string }>;
}

export interface SourcingInvite {
  id: number;
  sourcingRequestId: number;
  vendorReference: string;
  vendorName: string | null;
  round: number;
  status: string;
  createdAt: string;
}

export interface VendorQuoteLine {
  id: number;
  quoteReference: string;
  lineId: number;
  unitPrice: number;
  total: number;
}

export interface VendorQuote {
  id: number;
  reference: string;
  sourcingRequestId: number;
  vendorReference: string;
  vendorName: string | null;
  round: number;
  status: string;
  total: number;
  notes: string | null;
  submittedAt: string | null;
  lines: VendorQuoteLine[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorQuoteInput {
  sourcingRequestId: number;
  vendorReference: string;
  round?: number;
  notes?: string | null;
  lines: Array<{ lineId: number; unitPrice: number }>;
}

export const SOURCING_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
  withdrawn: 'Withdrawn',
};


export interface VendorContract {
  id: number;
  reference: string;
  vendorReference: string;
  vendorName: string | null;
  name: string;
  kind: string;
  url: string | null;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface VendorContractInput {
  vendorReference: string;
  name: string;
  kind?: string;
  url?: string | null;
  expiresAt?: string | null;
  uploadedBy?: string | null;
}

export interface VendorPayout {
  id: number;
  reference: string;
  vendorReference: string;
  vendorName: string | null;
  sourcingRequestReference: string | null;
  deliverable: string;
  amount: number;
  triggerType: string;
  status: string;
  released: boolean;
  releasedAt: string | null;
  releasedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPayoutInput {
  vendorReference: string;
  sourcingRequestReference?: string | null;
  deliverable: string;
  amount: number;
  triggerType?: string;
  status?: string;
  notes?: string | null;
}

export const VENDOR_PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  released: 'Released',
  rejected: 'Rejected',
};

export const VENDOR_PAYOUT_TRIGGER_LABELS: Record<string, string> = {
  client_approval: 'Client Approval',
  internal_signoff: 'Internal Signoff',
  deliverable_done: 'Deliverable Done',
  fixed_date: 'Fixed Date',
};

export interface VendorInvoice {
  id: number;
  reference: string;
  vendorReference: string;
  vendorName: string | null;
  sourcingRequestReference: string | null;
  purchaseOrderReference: string | null;
  goodsReceiptReference: string | null;
  status: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  issueDate: string | null;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  notes: string | null;
  createdBy: string;
  matchStatus: 'matched' | 'partial' | 'exception' | 'pending';
  matchedAmount: number;
  exceptionReason: string | null;
  lines: VendorInvoiceLine[];
  payments: VendorInvoicePayment[];
  creditNotes: VendorCreditNote[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorInvoiceLine {
  id: number;
  vendorInvoiceReference: string;
  sequence: number;
  description: string | null;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface VendorInvoiceLineInput {
  description?: string | null;
  amount: number;
  currency?: string;
}

export interface VendorInvoiceInput {
  vendorReference: string;
  sourcingRequestReference?: string | null;
  purchaseOrderReference?: string | null;
  goodsReceiptReference?: string | null;
  currency?: string;
  subtotal?: number;
  discountAmount?: number;
  taxPercent?: number;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  lines: VendorInvoiceLineInput[];
}

export interface VendorInvoicePayment {
  id: number;
  vendorInvoiceReference: string;
  amount: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paidAt: string;
  recordedBy: string;
  createdAt: string;
}

export interface VendorInvoicePaymentInput {
  vendorInvoiceReference: string;
  amount: number;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
  paidAt?: string;
  recordedBy?: string | null;
}

export interface VendorCreditNote {
  id: number;
  vendorInvoiceReference: string;
  amount: number;
  reason: string | null;
  refundedAt: string;
  recordedBy: string;
  createdAt: string;
}

export interface VendorCreditNoteInput {
  vendorInvoiceReference: string;
  amount: number;
  reason?: string | null;
  refundedAt?: string;
  recordedBy?: string | null;
}

export const VENDOR_INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  refunded: 'Refunded',
  void: 'Void',
};



