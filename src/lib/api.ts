import type { Lead, LeadInput, LeadSummary, ListFilters, Person, Customer, CustomerInput, CustomerSummary, Invoice, InvoiceInput, InvoiceSummary, Payment, PaymentInput, Proposal, ProposalInput, Task, TaskInput, Product, Contact, AuditLog, Expense, ExpenseInput, BusinessBranch, BusinessCommunication, ServiceRequest, ServiceRequestInput, HelpdeskTicket, TicketInput, CashAccount, CashTransaction, TaxRate, Currency, Document, DocumentInput, Vendor, VendorInput, PurchaseOrder, PurchaseOrderInput, InventoryAdjustment, QualityInspection, QualityInspectionInput, NonConformanceReport, NCRInput, Employee, EmployeeInput, Project, ProjectInput, TimeEntry, TimeEntryInput, Attendance, Payroll, ImportJob, SyncQueueItem, OfflineSnapshot, SyncStats, ResourceAllocation, ResourceAllocationInput, ResourceCapacity, Tag, TagInput, EntityTag, Asset, AssetInput, AssetCategory, AssetMaintenance, GoodsReceipt, GoodsReceiptInput, StockTransfer, StockTransferInput, SourcingRequest, SourcingRequestInput, VendorQuote, VendorQuoteInput, VendorContract, VendorContractInput, VendorPayout, VendorPayoutInput, VendorInvoice, VendorInvoiceInput, VendorInvoiceLineInput, VendorInvoicePayment, VendorInvoicePaymentInput, VendorCreditNote, VendorCreditNoteInput } from './types';

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.replace('/login');
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || res.statusText);
  }
  return res.json();
}

export const api = {
  listLeads: (filters?: ListFilters & { limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.source) params.set('source', filters.source);
    if (filters?.assignedTo) params.set('assignedTo', String(filters.assignedTo));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ leads: Lead[] }>(`/api/leads${qs ? `?${qs}` : ''}`);
  },
  getLead: (ref: string) => req<{ lead: Lead }>(`/api/leads/${encodeURIComponent(ref)}`),
  createLead: (input: LeadInput) => req<{ lead: Lead }>('/api/leads', { method: 'POST', body: JSON.stringify(input) }),
  updateLead: (ref: string, patch: Partial<LeadInput> & { stage?: string }) =>
    req<{ lead: Lead }>(`/api/leads/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteLead: (ref: string) => req<{ ok: boolean }>(`/api/leads/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  convertLead: (ref: string) => req<{ customer: Customer; lead: Lead }>(`/api/leads/${encodeURIComponent(ref)}/convert`, { method: 'POST' }),
  summary: () => req<{ summary: LeadSummary }>('/api/leads/summary'),
  people: () => req<{ people: Person[] }>('/api/people'),
  listCustomers: (filters?: { search?: string; status?: string; assignedTo?: number; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.assignedTo) params.set('assignedTo', String(filters.assignedTo));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ customers: Customer[] }>(`/api/customers${qs ? `?${qs}` : ''}`);
  },
  getCustomer: (ref: string) => req<{ customer: Customer }>(`/api/customers/${encodeURIComponent(ref)}`),
  createCustomer: (input: CustomerInput) => req<{ customer: Customer }>('/api/customers', { method: 'POST', body: JSON.stringify(input) }),
  updateCustomer: (ref: string, patch: Partial<CustomerInput> & { status?: string }) =>
    req<{ customer: Customer }>(`/api/customers/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCustomer: (ref: string) => req<{ ok: boolean }>(`/api/customers/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  customerSummary: () => req<{ summary: CustomerSummary }>('/api/customers/summary'),
  listInvoices: (filters?: { search?: string; status?: string; customerReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerReference) params.set('customerReference', filters.customerReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ invoices: Invoice[] }>(`/api/invoices${qs ? `?${qs}` : ''}`);
  },
  getInvoice: (ref: string) => req<{ invoice: Invoice }>(`/api/invoices/${encodeURIComponent(ref)}`),
  createInvoice: (input: InvoiceInput) => req<{ invoice: Invoice }>('/api/invoices', { method: 'POST', body: JSON.stringify(input) }),
  updateInvoice: (ref: string, patch: Partial<InvoiceInput> & { status?: string }) =>
    req<{ invoice: Invoice }>(`/api/invoices/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteInvoice: (ref: string) => req<{ ok: boolean }>(`/api/invoices/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  invoiceSummary: () => req<{ summary: InvoiceSummary }>('/api/invoices/summary'),
  listPayments: (filters?: { search?: string; status?: string; invoiceReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.invoiceReference) params.set('invoiceReference', filters.invoiceReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ payments: Payment[] }>(`/api/payments${qs ? `?${qs}` : ''}`);
  },
  createPayment: (input: PaymentInput) => req<{ payment: Payment }>('/api/payments', { method: 'POST', body: JSON.stringify(input) }),
  deletePayment: (ref: string) => req<{ ok: boolean }>(`/api/payments/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  updatePayment: (ref: string, patch: Partial<PaymentInput>) => req<{ payment: Payment }>(`/api/payments/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  listProposals: (filters?: { search?: string; status?: string; leadReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.leadReference) params.set('leadReference', filters.leadReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ proposals: Proposal[] }>(`/api/proposals${qs ? `?${qs}` : ''}`);
  },
  getProposal: (ref: string) => req<{ proposal: Proposal }>(`/api/proposals/${encodeURIComponent(ref)}`),
  createProposal: (input: ProposalInput) => req<{ proposal: Proposal }>('/api/proposals', { method: 'POST', body: JSON.stringify(input) }),
  deleteProposal: (ref: string) => req<{ ok: boolean }>(`/api/proposals/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  updateProposal: (ref: string, patch: Partial<ProposalInput>) => req<{ proposal: Proposal }>(`/api/proposals/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  listTasks: (filters?: { search?: string; status?: string; priority?: string; assignedTo?: number; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.assignedTo) params.set('assignedTo', String(filters.assignedTo));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ tasks: Task[] }>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (input: TaskInput) => req<{ task: Task }>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (ref: string, patch: Partial<TaskInput>) => req<{ task: Task }>(`/api/tasks/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTask: (ref: string) => req<{ ok: boolean }>(`/api/tasks/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listProducts: (filters?: { search?: string; status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ products: Product[] }>(`/api/products${qs ? `?${qs}` : ''}`);
  },
  createProduct: (input: Record<string, unknown>) => req<{ product: Product }>('/api/products', { method: 'POST', body: JSON.stringify(input) }),
  deleteProduct: (ref: string) => req<{ ok: boolean }>(`/api/products/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  updateProduct: (ref: string, patch: Record<string, unknown>) => req<{ product: Product }>(`/api/products/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  listContacts: (filters?: { customerReference?: string }) => {
    const params = new URLSearchParams();
    if (filters?.customerReference) params.set('customerReference', filters.customerReference);
    const qs = params.toString();
    return req<{ contacts: Contact[] }>(`/api/contacts${qs ? `?${qs}` : ''}`);
  },
  createContact: (input: Record<string, unknown>) => req<{ contact: Contact }>('/api/contacts', { method: 'POST', body: JSON.stringify(input) }),
  deleteContact: (ref: string) => req<{ ok: boolean }>(`/api/contacts/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  updateContact: (ref: string, patch: Record<string, unknown>) => req<{ contact: Contact }>(`/api/contacts/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  listBranches: (businessRef: string) => req<{ branches: BusinessBranch[] }>(`/api/branches?businessReference=${encodeURIComponent(businessRef)}`),
  createBranch: (input: Record<string, unknown>) => req<{ branch: BusinessBranch }>('/api/branches', { method: 'POST', body: JSON.stringify(input) }),
  deleteBranch: (ref: string) => req<{ ok: boolean }>(`/api/branches/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listCommunications: (businessRef: string) => req<{ communications: BusinessCommunication[] }>(`/api/communications?businessReference=${encodeURIComponent(businessRef)}`),
  createCommunication: (input: Record<string, unknown>) => req<{ communication: BusinessCommunication }>('/api/communications', { method: 'POST', body: JSON.stringify(input) }),
  listAuditLogs: (filters?: { entityType?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return req<{ logs: AuditLog[] }>(`/api/audit${qs ? `?${qs}` : ''}`);
  },
  search: (query: string) => req<{ results: Array<{ type: string; reference: string; title: string; subtitle?: string; url: string }> }>(`/api/search?q=${encodeURIComponent(query)}`),
  listRequests: (filters?: { search?: string; status?: string; priority?: string; businessReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.businessReference) params.set('businessReference', filters.businessReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ requests: ServiceRequest[] }>(`/api/requests${qs ? `?${qs}` : ''}`);
  },
  createRequest: (input: ServiceRequestInput) => req<{ request: ServiceRequest }>('/api/requests', { method: 'POST', body: JSON.stringify(input) }),
  updateRequest: (ref: string, patch: Partial<ServiceRequestInput>) => req<{ request: ServiceRequest }>(`/api/requests/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteRequest: (ref: string) => req<{ ok: boolean }>(`/api/requests/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listTickets: (filters?: { search?: string; status?: string; priority?: string; businessReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.businessReference) params.set('businessReference', filters.businessReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ tickets: HelpdeskTicket[] }>(`/api/tickets${qs ? `?${qs}` : ''}`);
  },
  createTicket: (input: TicketInput) => req<{ ticket: HelpdeskTicket }>('/api/tickets', { method: 'POST', body: JSON.stringify(input) }),
  updateTicket: (ref: string, patch: Partial<TicketInput>) => req<{ ticket: HelpdeskTicket }>(`/api/tickets/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTicket: (ref: string) => req<{ ok: boolean }>(`/api/tickets/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listCashAccounts: (filters?: { search?: string; type?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ accounts: CashAccount[] }>(`/api/cash/accounts${qs ? `?${qs}` : ''}`);
  },
  createCashAccount: (input: Record<string, unknown>) => req<{ account: CashAccount }>('/api/cash/accounts', { method: 'POST', body: JSON.stringify(input) }),
  updateCashAccount: (ref: string, patch: Record<string, unknown>) => req<{ account: CashAccount }>(`/api/cash/accounts/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCashAccount: (ref: string) => req<{ ok: boolean }>(`/api/cash/accounts/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listCashTransactions: (filters?: { accountReference?: string; type?: string; reconciled?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.accountReference) params.set('accountReference', filters.accountReference);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.reconciled !== undefined) params.set('reconciled', String(filters.reconciled));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ transactions: CashTransaction[] }>(`/api/cash/transactions${qs ? `?${qs}` : ''}`);
  },
  createCashTransaction: (input: Record<string, unknown>) => req<{ transaction: CashTransaction }>('/api/cash/transactions', { method: 'POST', body: JSON.stringify(input) }),
  reconcileTransaction: (ref: string) => req<{ transaction: CashTransaction }>(`/api/cash/transactions/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({ action: 'reconcile' }) }),
  deleteCashTransaction: (ref: string) => req<{ ok: boolean }>(`/api/cash/transactions/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listImportJobs: () => req<{ jobs: ImportJob[] }>('/api/import-jobs'),
  createImportJob: (input: { entityType: string; fileName: string; csv: string }) => req<{ job: ImportJob; result: { processed: number; errors: string[] } }>('/api/import-jobs', { method: 'POST', body: JSON.stringify(input) }),
  exportData: (entity: string) => `/api/export?entity=${entity}`,
  listTags: (filters?: { search?: string; entityType?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ tags: Tag[] }>(`/api/tags${qs ? `?${qs}` : ''}`);
  },
  createTag: (input: TagInput) => req<{ tag: Tag }>('/api/tags', { method: 'POST', body: JSON.stringify(input) }),
  deleteTag: (ref: string) => req<{ ok: boolean }>(`/api/tags/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  getEntityTags: (entityType: string, entityReference: string) => req<{ tags: Tag[] }>(`/api/entity-tags?entityType=${encodeURIComponent(entityType)}&entityReference=${encodeURIComponent(entityReference)}`),
  addTagToEntity: (input: { tagReference: string; entityType: string; entityReference: string }) => req<{ ok: boolean }>('/api/entity-tags', { method: 'POST', body: JSON.stringify(input) }),
  removeTagFromEntity: (input: { tagReference: string; entityType: string; entityReference: string }) => req<{ ok: boolean }>('/api/entity-tags', { method: 'DELETE', body: JSON.stringify(input) }),
  listWorkflowRules: (filters?: { triggerEvent?: string; isActive?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.triggerEvent) params.set('triggerEvent', filters.triggerEvent);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ rules: Record<string, unknown>[] }>(`/api/workflow-rules${qs ? `?${qs}` : ''}`);
  },
  createWorkflowRule: (input: Record<string, unknown>) => req<{ rule: Record<string, unknown> }>('/api/workflow-rules', { method: 'POST', body: JSON.stringify(input) }),
  deleteWorkflowRule: (ref: string) => req<{ ok: boolean }>(`/api/workflow-rules/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  updateWorkflowRule: (ref: string, patch: Record<string, unknown>) => req<{ rule: Record<string, unknown> }>(`/api/workflow-rules/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updateEmailTemplate: (ref: string, patch: Record<string, unknown>) => req<{ template: Record<string, unknown> }>(`/api/email-templates/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updateScheduledReport: (ref: string, patch: Record<string, unknown>) => req<{ report: Record<string, unknown> }>(`/api/scheduled-reports/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updateDocument: (ref: string, patch: Record<string, unknown>) => req<{ document: Record<string, unknown> }>(`/api/documents/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updateResourceCapacity: (id: number, patch: Record<string, unknown>) => req<{ capacity: Record<string, unknown> }>(`/api/resource-capacity/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteResourceCapacity: (id: number) => req<{ ok: boolean }>(`/api/resource-capacity/${id}`, { method: 'DELETE' }),
  listAssets: (filters?: { search?: string; status?: string; businessReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.businessReference) params.set('businessReference', filters.businessReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ assets: Asset[] }>(`/api/assets${qs ? `?${qs}` : ''}`);
  },
  createAsset: (input: AssetInput) => req<{ asset: Asset }>('/api/assets', { method: 'POST', body: JSON.stringify(input) }),
  getAsset: (ref: string) => req<{ asset: Asset }>(`/api/assets/${encodeURIComponent(ref)}`),
  updateAsset: (ref: string, patch: Partial<AssetInput>) => req<{ asset: Asset }>(`/api/assets/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteAsset: (ref: string) => req<{ ok: boolean }>(`/api/assets/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  deployAsset: (ref: string, assignedTo: number | null, assignedBranch: string | null, reason: string) => req<{ asset: Asset }>(`/api/assets/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({ action: 'deploy', assignedTo, assignedBranch, reason }) }),
  maintainAsset: (ref: string, reason: string) => req<{ asset: Asset }>(`/api/assets/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({ action: 'maintain', reason }) }),
  loseAsset: (ref: string, reason: string) => req<{ asset: Asset }>(`/api/assets/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({ action: 'lose', reason }) }),
  disposeAsset: (ref: string, disposal: { disposalDate: string; disposalMethod: 'sale' | 'scrap' | 'donation' | 'trade_in'; disposalProceeds: number; disposalCost?: number; disposalVendorRef?: string; disposalNotes?: string }) => req<{ asset: Asset }>(`/api/assets/${encodeURIComponent(ref)}/dispose`, { method: 'POST', body: JSON.stringify(disposal) }),
  getAssetDepreciation: (ref: string) => req<{ depreciation: { monthlyDepreciation: number; annualDepreciation: number; remainingValue: number; monthsRemaining: number } }>(`/api/assets/${encodeURIComponent(ref)}/depreciation`),
  getAssetTCO: (ref: string) => req<{ tco: { asset: Asset; purchasePrice: number; totalMaintenance: number; totalDepreciation: number; disposalProceeds: number; disposalCosts: number; tco: number } }>(`/api/assets/${encodeURIComponent(ref)}/tco`),
  runDepreciation: () => req<{ result: { processed: number; totalDepreciation: number; errors: string[] } }>('/api/assets/depreciation', { method: 'POST' }),
  listAssetCategories: () => req<{ categories: AssetCategory[] }>('/api/assets/categories'),
  createAssetCategory: (input: Record<string, unknown>) => req<{ category: AssetCategory }>('/api/assets/categories', { method: 'POST', body: JSON.stringify(input) }),
  listAssetMaintenance: (assetRef: string) => req<{ maintenance: AssetMaintenance[] }>(`/api/asset-maintenance?assetReference=${encodeURIComponent(assetRef)}`),
  createAssetMaintenance: (input: Record<string, unknown>) => req<{ maintenance: AssetMaintenance }>('/api/asset-maintenance', { method: 'POST', body: JSON.stringify(input) }),
  updateImportJob: (ref: string, patch: Record<string, unknown>) => req<{ job: Record<string, unknown> }>(`/api/import-jobs/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteImportJob: (ref: string) => req<{ ok: boolean }>(`/api/import-jobs/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  deleteSync: (id: number) => req<{ ok: boolean }>(`/api/offline/sync/${id}`, { method: 'DELETE' }),
  listEmailTemplates: (filters?: { type?: string; isActive?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ templates: Record<string, unknown>[] }>(`/api/email-templates${qs ? `?${qs}` : ''}`);
  },
  createEmailTemplate: (input: Record<string, unknown>) => req<{ template: Record<string, unknown> }>('/api/email-templates', { method: 'POST', body: JSON.stringify(input) }),
  deleteEmailTemplate: (ref: string) => req<{ ok: boolean }>(`/api/email-templates/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listScheduledReports: (filters?: { isActive?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ reports: Record<string, unknown>[] }>(`/api/scheduled-reports${qs ? `?${qs}` : ''}`);
  },
  createScheduledReport: (input: Record<string, unknown>) => req<{ report: Record<string, unknown> }>('/api/scheduled-reports', { method: 'POST', body: JSON.stringify(input) }),
  deleteScheduledReport: (ref: string) => req<{ ok: boolean }>(`/api/scheduled-reports/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listNotifications: (filters?: { isRead?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) params.set('isRead', String(filters.isRead));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ notifications: Record<string, unknown>[] }>(`/api/notifications${qs ? `?${qs}` : ''}`);
  },
  createNotification: (input: Record<string, unknown>) => req<{ notification: Record<string, unknown> }>('/api/notifications', { method: 'POST', body: JSON.stringify(input) }),
  markNotificationRead: (ref: string) => req<{ ok: boolean }>(`/api/notifications/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({}) }),
  deleteNotification: (ref: string) => req<{ ok: boolean }>(`/api/notifications/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listPendingSyncs: (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return req<{ syncs: SyncQueueItem[] }>(`/api/offline/sync${qs ? `?${qs}` : ''}`);
  },
  enqueueSync: (input: { entityType: string; entityReference: string; action: string; payload?: Record<string, unknown> }) => req<{ ok: boolean }>('/api/offline/sync', { method: 'POST', body: JSON.stringify(input) }),
  markSyncProcessed: (id: number) => req<{ ok: boolean }>(`/api/offline/sync/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'processed' }) }),
  markSyncFailed: (id: number) => req<{ ok: boolean }>(`/api/offline/sync/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'failed' }) }),
  getSnapshot: (entityType: string, entityReference: string) => req<{ snapshot: OfflineSnapshot | null }>(`/api/offline/snapshot?entityType=${encodeURIComponent(entityType)}&entityReference=${encodeURIComponent(entityReference)}`),
  saveSnapshot: (input: { entityType: string; entityReference: string; data: Record<string, unknown>; version?: number }) => req<{ ok: boolean }>('/api/offline/snapshot', { method: 'POST', body: JSON.stringify(input) }),
  getSyncStats: () => req<{ stats: SyncStats }>('/api/offline/stats'),
  listQualityInspections: (filters?: { search?: string; status?: string; type?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ inspections: QualityInspection[] }>(`/api/quality/inspections${qs ? `?${qs}` : ''}`);
  },
  createQualityInspection: (input: QualityInspectionInput) => req<{ inspection: QualityInspection }>('/api/quality/inspections', { method: 'POST', body: JSON.stringify(input) }),
  updateQualityInspection: (ref: string, patch: Partial<QualityInspectionInput>) => req<{ inspection: QualityInspection }>(`/api/quality/inspections/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteQualityInspection: (ref: string) => req<{ ok: boolean }>(`/api/quality/inspections/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listNCRs: (filters?: { search?: string; status?: string; severity?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ ncrs: NonConformanceReport[] }>(`/api/quality/ncrs${qs ? `?${qs}` : ''}`);
  },
  createNCR: (input: NCRInput) => req<{ ncr: NonConformanceReport }>('/api/quality/ncrs', { method: 'POST', body: JSON.stringify(input) }),
  updateNCR: (ref: string, patch: Partial<NCRInput>) => req<{ ncr: NonConformanceReport }>(`/api/quality/ncrs/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteNCR: (ref: string) => req<{ ok: boolean }>(`/api/quality/ncrs/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listEmployees: (filters?: { search?: string; department?: string; status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.department) params.set('department', filters.department);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ employees: Employee[] }>(`/api/employees${qs ? `?${qs}` : ''}`);
  },
  createEmployee: (input: EmployeeInput) => req<{ employee: Employee }>('/api/employees', { method: 'POST', body: JSON.stringify(input) }),
  updateEmployee: (ref: string, patch: Partial<EmployeeInput>) => req<{ employee: Employee }>(`/api/employees/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteEmployee: (ref: string) => req<{ ok: boolean }>(`/api/employees/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listProjects: (filters?: { search?: string; status?: string; priority?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ projects: Project[] }>(`/api/projects${qs ? `?${qs}` : ''}`);
  },
  createProject: (input: ProjectInput) => req<{ project: Project }>('/api/projects', { method: 'POST', body: JSON.stringify(input) }),
  updateProject: (ref: string, patch: Partial<ProjectInput>) => req<{ project: Project }>(`/api/projects/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteProject: (ref: string) => req<{ ok: boolean }>(`/api/projects/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listTimeEntries: (filters?: { employeeReference?: string; projectReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.employeeReference) params.set('employeeReference', filters.employeeReference);
    if (filters?.projectReference) params.set('projectReference', filters.projectReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ entries: TimeEntry[] }>(`/api/time-entries${qs ? `?${qs}` : ''}`);
  },
  createTimeEntry: (input: TimeEntryInput) => req<{ entry: TimeEntry }>('/api/time-entries', { method: 'POST', body: JSON.stringify(input) }),
  deleteTimeEntry: (ref: string) => req<{ ok: boolean }>(`/api/time-entries/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listPayroll: (filters?: { employeeReference?: string; status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.employeeReference) params.set('employeeReference', filters.employeeReference);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ payroll: Payroll[] }>(`/api/payroll${qs ? `?${qs}` : ''}`);
  },
  createPayroll: (input: Record<string, unknown>) => req<{ payroll: Payroll }>('/api/payroll', { method: 'POST', body: JSON.stringify(input) }),
  updatePayroll: (ref: string, patch: Record<string, unknown>) => req<{ payroll: Payroll }>(`/api/payroll/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePayroll: (ref: string) => req<{ ok: boolean }>(`/api/payroll/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listResourceAllocations: (filters?: { employeeReference?: string; projectReference?: string; status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.employeeReference) params.set('employeeReference', filters.employeeReference);
    if (filters?.projectReference) params.set('projectReference', filters.projectReference);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ allocations: ResourceAllocation[] }>(`/api/resource-allocations${qs ? `?${qs}` : ''}`);
  },
  createResourceAllocation: (input: ResourceAllocationInput) => req<{ allocation: ResourceAllocation }>('/api/resource-allocations', { method: 'POST', body: JSON.stringify(input) }),
  updateResourceAllocation: (ref: string, patch: Partial<ResourceAllocationInput>) => req<{ allocation: ResourceAllocation }>(`/api/resource-allocations/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteResourceAllocation: (ref: string) => req<{ ok: boolean }>(`/api/resource-allocations/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listResourceCapacity: (filters?: { employeeReference?: string; date?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.employeeReference) params.set('employeeReference', filters.employeeReference);
    if (filters?.date) params.set('date', filters.date);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ capacity: ResourceCapacity[] }>(`/api/resource-capacity${qs ? `?${qs}` : ''}`);
  },
  createResourceCapacity: (input: Record<string, unknown>) => req<{ capacity: ResourceCapacity }>('/api/resource-capacity', { method: 'POST', body: JSON.stringify(input) }),
  getUtilizationReport: (startDate: string, endDate: string) => req<{ report: Record<string, unknown> }>(`/api/resource-utilization?startDate=${startDate}&endDate=${endDate}`),
  listAttendance: (filters?: { employeeReference?: string; date?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.employeeReference) params.set('employeeReference', filters.employeeReference);
    if (filters?.date) params.set('date', filters.date);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ attendance: Attendance[] }>(`/api/attendance${qs ? `?${qs}` : ''}`);
  },
  createAttendance: (input: Record<string, unknown>) => req<{ attendance: Attendance }>('/api/attendance', { method: 'POST', body: JSON.stringify(input) }),
  listVendors: (filters?: { search?: string; status?: string; kind?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ vendors: Vendor[] }>(`/api/vendors${qs ? `?${qs}` : ''}`);
  },
  createVendor: (input: VendorInput) => req<{ vendor: Vendor }>('/api/vendors', { method: 'POST', body: JSON.stringify(input) }),
  updateVendor: (ref: string, patch: Partial<VendorInput>) => req<{ vendor: Vendor }>(`/api/vendors/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteVendor: (ref: string) => req<{ ok: boolean }>(`/api/vendors/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listPurchaseOrders: (filters?: { search?: string; status?: string; vendorReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.vendorReference) params.set('vendorReference', filters.vendorReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ orders: PurchaseOrder[] }>(`/api/purchase-orders${qs ? `?${qs}` : ''}`);
  },
  createPurchaseOrder: (input: PurchaseOrderInput) => req<{ order: PurchaseOrder }>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(input) }),
  updatePurchaseOrder: (ref: string, patch: { status?: string; notes?: string | null; expectedDelivery?: string | null }) => req<{ order: PurchaseOrder }>(`/api/purchase-orders/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePurchaseOrder: (ref: string) => req<{ ok: boolean }>(`/api/purchase-orders/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listGoodsReceipts: (filters?: { poReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.poReference) params.set('poReference', filters.poReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ receipts: GoodsReceipt[] }>(`/api/goods-receipts${qs ? `?${qs}` : ''}`);
  },
  getGoodsReceipt: (ref: string) => req<{ receipt: GoodsReceipt }>(`/api/goods-receipts/${encodeURIComponent(ref)}`),
  createGoodsReceipt: (input: GoodsReceiptInput) => req<{ receipt: GoodsReceipt }>('/api/goods-receipts', { method: 'POST', body: JSON.stringify(input) }),
  getPOReceiving: (ref: string) => req<{ receiving: { poReference: string; items: Array<{ id: number; description: string; productReference: string | null; ordered: number; received: number; outstanding: number; fullyReceived: boolean }>; fullyReceived: boolean; partiallyReceived: boolean } }>(`/api/purchase-orders/${encodeURIComponent(ref)}/receiving`),
  getInvoiceGate: (ref: string) => req<{ gate: { allowed: boolean; reason: string; receivedValue: number; orderedValue: number; receivedPercent: number } }>(`/api/purchase-orders/${encodeURIComponent(ref)}/invoice-gate`),
  listReorderCandidates: () => req<{ candidates: Product[] }>('/api/reorder-candidates'),
  listStockTransfers: (filters?: { status?: string; productReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.productReference) params.set('productReference', filters.productReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ transfers: StockTransfer[] }>(`/api/stock-transfers${qs ? `?${qs}` : ''}`);
  },
  createStockTransfer: (input: StockTransferInput) => req<{ transfer: StockTransfer }>('/api/stock-transfers', { method: 'POST', body: JSON.stringify(input) }),
  updateStockTransferStatus: (ref: string, status: string) => req<{ transfer: StockTransfer }>(`/api/stock-transfers/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listSourcingRequests: (filters?: { status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ requests: SourcingRequest[] }>(`/api/sourcing-requests${qs ? `?${qs}` : ''}`);
  },
  getSourcingRequest: (ref: string) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}`),
  createSourcingRequest: (input: SourcingRequestInput) => req<{ request: SourcingRequest }>('/api/sourcing-requests', { method: 'POST', body: JSON.stringify(input) }),
  updateSourcingRequest: (ref: string, patch: Record<string, unknown>) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  publishSourcingRequest: (ref: string) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/publish`, { method: 'POST' }),
  cancelSourcingRequest: (ref: string) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/cancel`, { method: 'POST' }),
  inviteVendors: (ref: string, vendorReferences: string[], round?: number) => req<{ invites: unknown[] }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/invite`, { method: 'POST', body: JSON.stringify({ vendorReferences, round }) }),
  listInvites: (ref: string) => req<{ invites: unknown[] }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/invite`),
  awardLine: (ref: string, lineId: number, vendorReference: string) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/award`, { method: 'POST', body: JSON.stringify({ lineId, vendorReference }) }),
  awardWhole: (ref: string, vendorReference: string) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/award-whole`, { method: 'POST', body: JSON.stringify({ vendorReference }) }),
  nextRound: (ref: string, vendorReferences?: string[]) => req<{ request: SourcingRequest }>(`/api/sourcing-requests/${encodeURIComponent(ref)}/next-round`, { method: 'POST', body: JSON.stringify({ vendorReferences }) }),
  listVendorQuotes: (sourcingRequestId: number, round?: number) => {
    const params = new URLSearchParams({ sourcingRequestId: String(sourcingRequestId) });
    if (round) params.set('round', String(round));
    return req<{ quotes: VendorQuote[] }>(`/api/vendor-quotes?${params.toString()}`);
  },
  submitVendorQuote: (input: VendorQuoteInput) => req<{ quote: VendorQuote }>('/api/vendor-quotes', { method: 'POST', body: JSON.stringify(input) }),
  listVendorContracts: (filters?: { vendorReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.vendorReference) params.set('vendorReference', filters.vendorReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ contracts: VendorContract[] }>(`/api/vendor-contracts${qs ? `?${qs}` : ''}`);
  },
  createVendorContract: (input: VendorContractInput) => req<{ contract: VendorContract }>('/api/vendor-contracts', { method: 'POST', body: JSON.stringify(input) }),
  verifyVendorContract: (ref: string, verifiedBy: string) => req<{ contract: VendorContract }>(`/api/vendor-contracts/${encodeURIComponent(ref)}/verify`, { method: 'POST', body: JSON.stringify({ verifiedBy }) }),
  listVendorPayouts: (filters?: { vendorReference?: string; status?: string; released?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.vendorReference) params.set('vendorReference', filters.vendorReference);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.released !== undefined) params.set('released', String(filters.released));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ payouts: VendorPayout[] }>(`/api/vendor-payouts${qs ? `?${qs}` : ''}`);
  },
  createVendorPayout: (input: VendorPayoutInput) => req<{ payout: VendorPayout }>('/api/vendor-payouts', { method: 'POST', body: JSON.stringify(input) }),
  releaseVendorPayout: (ref: string) => req<{ payout: VendorPayout }>(`/api/vendor-payouts/${encodeURIComponent(ref)}/release`, { method: 'POST' }),
  updateVendorPayoutStatus: (ref: string, status: string) => req<{ payout: VendorPayout }>(`/api/vendor-payouts/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listVendorInvoices: (filters?: { vendorReference?: string; status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.vendorReference) params.set('vendorReference', filters.vendorReference);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ invoices: VendorInvoice[] }>(`/api/vendor-invoices${qs ? `?${qs}` : ''}`);
  },
  getVendorInvoice: (ref: string) => req<{ invoice: VendorInvoice }>(`/api/vendor-invoices/${encodeURIComponent(ref)}`),
  createVendorInvoice: (input: VendorInvoiceInput) => req<{ invoice: VendorInvoice }>('/api/vendor-invoices', { method: 'POST', body: JSON.stringify(input) }),
  issueVendorInvoice: (ref: string) => req<{ invoice: VendorInvoice }>(`/api/vendor-invoices/${encodeURIComponent(ref)}/issue`, { method: 'POST' }),
  voidVendorInvoice: (ref: string) => req<{ invoice: VendorInvoice }>(`/api/vendor-invoices/${encodeURIComponent(ref)}/void`, { method: 'POST' }),
  recordVendorInvoicePayment: (input: VendorInvoicePaymentInput) => req<{ payment: VendorInvoicePayment }>(`/api/vendor-invoices/${encodeURIComponent(input.vendorInvoiceReference)}/payments`, { method: 'POST', body: JSON.stringify(input) }),
  recordVendorCreditNote: (input: VendorCreditNoteInput) => req<{ creditNote: VendorCreditNote }>(`/api/vendor-invoices/${encodeURIComponent(input.vendorInvoiceReference)}/credit-notes`, { method: 'POST', body: JSON.stringify(input) }),
  matchVendorInvoice: (ref: string) => req<{ result: { matched: boolean; matchedAmount: number; status: string; reason?: string } }>(`/api/vendor-invoices/${encodeURIComponent(ref)}/match`, { method: 'POST' }),
  autoMatchVendorInvoices: () => req<{ result: { processed: number; matched: number; exceptions: number } }>('/api/vendor-invoices/auto-match', { method: 'POST' }),

  listInventoryAdjustments: (filters?: { productReference?: string; type?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.productReference) params.set('productReference', filters.productReference);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ adjustments: InventoryAdjustment[] }>(`/api/inventory${qs ? `?${qs}` : ''}`);
  },
  createInventoryAdjustment: (input: Record<string, unknown>) => req<{ adjustment: InventoryAdjustment }>('/api/inventory', { method: 'POST', body: JSON.stringify(input) }),
  listDocuments: (filters?: { entityType?: string; entityReference?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.entityReference) params.set('entityReference', filters.entityReference);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ documents: Document[] }>(`/api/documents${qs ? `?${qs}` : ''}`);
  },
  createDocument: (input: DocumentInput) => req<{ document: Document }>('/api/documents', { method: 'POST', body: JSON.stringify(input) }),
  deleteDocument: (ref: string) => req<{ ok: boolean }>(`/api/documents/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  getReport: (type: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ type });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return req<{ report: Record<string, unknown> }>(`/api/reports?${params.toString()}`);
  },
  listTaxRates: (filters?: { search?: string; type?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ rates: TaxRate[] }>(`/api/tax-rates${qs ? `?${qs}` : ''}`);
  },
  createTaxRate: (input: Record<string, unknown>) => req<{ rate: TaxRate }>('/api/tax-rates', { method: 'POST', body: JSON.stringify(input) }),
  updateTaxRate: (ref: string, patch: Record<string, unknown>) => req<{ rate: TaxRate }>(`/api/tax-rates/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTaxRate: (ref: string) => req<{ ok: boolean }>(`/api/tax-rates/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
  listCurrencies: (filters?: { search?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ currencies: Currency[] }>(`/api/currencies${qs ? `?${qs}` : ''}`);
  },
  createCurrency: (input: Record<string, unknown>) => req<{ currency: Currency }>('/api/currencies', { method: 'POST', body: JSON.stringify(input) }),
  updateCurrency: (code: string, patch: Record<string, unknown>) => req<{ currency: Currency }>(`/api/currencies/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCurrency: (code: string) => req<{ ok: boolean }>(`/api/currencies/${encodeURIComponent(code)}`, { method: 'DELETE' }),
  listExpenses: (filters?: { search?: string; status?: string; category?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.page) params.set('page', String(filters.page));
    const qs = params.toString();
    return req<{ expenses: Expense[] }>(`/api/expenses${qs ? `?${qs}` : ''}`);
  },
  createExpense: (input: ExpenseInput) => req<{ expense: Expense }>('/api/expenses', { method: 'POST', body: JSON.stringify(input) }),
  updateExpense: (ref: string, patch: Partial<ExpenseInput>) => req<{ expense: Expense }>(`/api/expenses/${encodeURIComponent(ref)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteExpense: (ref: string) => req<{ ok: boolean }>(`/api/expenses/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
};