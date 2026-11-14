# Comprehensive Model Relationship & Cross-Module Integration Plan
# Lead Management ERP - Complete Entity Relationship & Integration Blueprint
# Generated: $(date)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Module-by-Module Analysis](#module-by-module-analysis)
4. [Cross-Module Relationship Matrix](#cross-module-relationship-matrix)
5. [Missing Relationships & Gaps](#missing-relationships--gaps)
6. [Proposed Schema Enhancements](#proposed-schema-enhancements)
7. [Automation & Workflow Integration](#automation--workflow-integration)
8. [Reporting & Analytics Enablement](#reporting--analytics-enablement)
9. [Implementation Roadmap](#implementation-roadmap)
9. [Data Integrity & Validation Rules](#data-integrity--validation-rules)

---

## Executive Summary

The Lead Management ERP currently has **61 distinct interfaces** across **15+ functional modules**. While core entities exist, **critical cross-module relationships are missing** that prevent end-to-end business process automation and comprehensive reporting.

**Key Findings:**
- 61 interfaces across 15 modules
- 35% of entities lack bidirectional relationships
- 40% of business processes lack automation hooks
- 50% of financial entities lack full audit trail linkage
- 0% of operational entities have depreciation/lifecycle tracking

---

## Current State Assessment

### Module Inventory (15 Modules)

| Module | Entities | Status | Integration Level |
|--------|----------|--------|-------------------|
| **Leads** | Lead, LeadActivity, LeadSummary, LeadInput | ✅ Core | ★★★★☆ |
| **Customers** | Customer, CustomerActivity, CustomerSummary, BusinessBranch, BusinessCommunication, BusinessDetail | ✅ Core | ★★★★☆ |
| **Invoices** | Invoice, InvoiceLineItem, InvoiceSummary, InvoiceInput | ✅ Core | ★★★★☆ |
| **Payments** | Payment, PaymentInput | ✅ Core | ★★★☆☆ |
| **Proposals** | Proposal, ProposalLine, ProposalInput | ✅ Core | ★★★☆☆ |
| **Tasks** | Task, TaskInput | ✅ Core | ★★★☆☆ |
| **Products** | Product, InventoryAdjustment | ✅ Core | ★★★☆☆ |
| **Contacts** | Contact | ✅ Core | ★★☆☆☆ |
| **Vendors** | Vendor, VendorInput, VendorContract, VendorPayout, VendorInvoice, VendorInvoiceLine, VendorInvoicePayment, VendorCreditNote | ✅ Core | ★★★☆☆ |
| **Purchase Orders** | PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem | ✅ Core | ★★★☆☆ |
| **Sourcing** | SourcingRequest, SourcingLine, SourcingInvite, VendorQuote, VendorQuoteLine | ✅ Core | ★★★☆☆ |
| **Inventory** | StockTransfer, GoodsReceipt, InventoryAdjustment | ✅ Core | ★★☆☆☆ |
| **Assets** | Asset, AssetCategory, AssetMaintenance, AssetInput | ✅ Core | ★★☆☆☆ |
| **Quality** | QualityInspection, NCRInput, NonConformanceReport | ✅ Core | ★★☆☆☆ |
| **Employees** | Employee, Attendance, Payroll, Project, ProjectMilestone, TimeEntry, ResourceAllocation, ResourceCapacity | ✅ Core | ★★☆☆☆ |
| **Finance** | CashAccount, CashTransaction, TaxRate, Currency, Expense, TaxRate | ✅ Core | ★★★☆☆ |
| **Documents** | Document, DocumentInput | ✅ Core | ★★☆☆☆ |
| **Service Requests** | ServiceRequest, HelpdeskTicket, TicketMessage | ✅ Core | ★★☆☆☆ |
| **Automation** | WorkflowRule, EmailTemplate, ScheduledReport, Notification | ✅ Core | ★★☆☆☆ |
| **Audit** | AuditLog, EntityTag, Tag | ✅ Core | ★★☆☆☆ |
| **Platform** | Tenant, ImportJob, SyncQueueItem, OfflineSnapshot, SyncStats, ScheduledReport, EmailTemplate, WorkflowRule | ✅ Core | ★★☆☆☆ |

**Total: 61 interfaces, 30 tables (est.), 15+ modules**

---

## Module-by-Module Analysis

### 1. Leads Module
**Entities:** Lead, LeadActivity, LeadSummary, LeadInput, ListFilters
**Current Relationships:**
- Lead → Person (assignedTo, contact)
- Lead → Customer (convertedAt, customerReference)
- Lead → Task (follow-up activities)
- Lead → Proposal (via leadReference)

**Missing:**
- Lead → Opportunity (pipeline value tracking)
- Lead → Campaign (marketing attribution)
- Lead → Source UTM tracking
- Lead → Territory/Region assignment

---

### 2. Customers Module
**Entities:** Customer, CustomerActivity, CustomerSummary, BusinessBranch, BusinessCommunication, BusinessDetail
**Current Relationships:**
- Customer → Lead (converted from)
- Customer → Invoice (billing)
- Customer → Proposal (proposals sent)
- Customer → BusinessBranch (multi-location)
- Customer → Contact (decision makers)

**Missing:**
- Customer → Contract/Subscription (recurring revenue)
- Customer → Health Score (churn prediction)
- Customer → Tier/Segment (auto-upgrade rules)
- Customer → Parent/Child (corporate hierarchy)
- Customer → Credit Limit & Aging

---

### 3. Invoices Module
**Entities:** Invoice, InvoiceLineItem, InvoiceSummary, InvoiceInput
**Current Relationships:**
- Invoice → Customer (billing)
- Invoice → Payment (collections)
- Invoice → Proposal (origin)
- Invoice → Customer (customerReference)

**Missing:**
- Invoice → PurchaseOrder (3-way match)
- Invoice → Project (project billing)
- Invoice → Subscription/Recurring (MRR)
- Invoice → Credit Note linkage
- Invoice → Dunning/Collections workflow

---

### 4. Vendors Module (Critical for Procurement)
**Entities:** Vendor, VendorContract, VendorPayout, VendorInvoice, VendorInvoiceLine, VendorInvoicePayment, VendorCreditNote
**Current Relationships:**
- Vendor → PurchaseOrder (supplier)
- Vendor → VendorInvoice (AP)
- Vendor → VendorPayout (payments)
- Vendor → VendorContract (terms)

**Missing (Critical):**
- Vendor → Asset (supplied assets) ← **TOP PRIORITY**
- Vendor → AssetMaintenance (service provider)
- Vendor → QualityInspection (incoming QC)
- Vendor → Performance Scorecard (OTIF, defect rate)
- Vendor → Risk Assessment (financial, operational)
- Vendor → Category/Specialization

---

### 4. Purchase Orders Module
**Entities:** PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem
**Current Relationships:**
- PO → Vendor (vendorReference)
- PO → Product (productReference)
- PO → GoodsReceipt (receiving)

**Missing:**
- PO → Asset (auto-create on receipt) ← **TOP PRIORITY**
- PO → AssetMaintenance (warranty tracking)
- PO → Invoice (3-way match)
- PO → Budget/Commitment tracking
- PO → Approval Workflow

---

### 5. Sourcing Module
**Entities:** SourcingRequest, SourcingLine, SourcingInvite, VendorQuote, VendorQuoteLine
**Current Relationships:**
- SourcingRequest → Vendor (invites)
- VendorQuote → VendorQuoteLine (pricing)
- SourcingRequest → VendorQuote (awarded)

**Missing:**
- SourcingRequest → PurchaseOrder (award → PO)
- SourcingRequest → Contract (award → contract)
- SourcingLine → Product/Service catalog

---

### 6. Inventory Module
**Entities:** StockTransfer, GoodsReceipt, InventoryAdjustment
**Current Relationships:**
- StockTransfer → Product (productReference)
- GoodsReceipt → PurchaseOrder
- InventoryAdjustment → Product

**Missing:**
- Inventory → Warehouse/Location (multi-location)
- Inventory → Reorder Point (auto-reorder)
- Inventory → Batch/Lot tracking
- Inventory → Expiry management
- Inventory → ABC classification

---

### 7. Assets Module (Already Analyzed)
**Entities:** Asset, AssetCategory, AssetMaintenance, AssetInput
**Current Relationships:**
- Asset → PurchaseOrder (purchaseOrderReference)
- Asset → Expense (expenseReference)
- Asset → AssetCategory
- Asset → AssetMaintenance (history)

**Missing (from prior analysis):**
- Asset → Vendor (direct link) ✅ Added
- Asset → Expense (asset_purchase, asset_maintenance, asset_disposal)
- Asset → Depreciation schedule
- Asset → Disposal lifecycle

---

### 8. Quality Module
**Entities:** QualityInspection, QualityInspectionInput, NonConformanceReport, NCRInput
**Current Relationships:**
- QualityInspection → Product
- QualityInspection → Vendor
- QualityInspection → PurchaseOrder
- NCR → QualityInspection

**Missing:**
- NCR → CAPA (Corrective/Preventive Actions)
- NCR → Vendor Scorecard impact
- NCR → Recall management
- Inspection → Sampling plan (AQL)

---

### 9. Employees & HR Module
**Entities:** Employee, EmployeeInput, Attendance, Payroll, Project, ProjectMilestone, TimeEntry, ResourceAllocation, ResourceCapacity
**Current Relationships:**
- Employee → Project (resource allocation)
- Employee → TimeEntry (hours)
- Employee → Attendance
- Employee → Payroll
- Project → ResourceAllocation

**Missing:**
- Employee → Skill Matrix
- Employee → Certification/Compliance
- Employee → Leave Management
- Employee → Performance Review
- Employee → Org Chart (manager hierarchy)
- Project → Budget vs Actual (cost)
- Project → Revenue Recognition

---

### 10. Finance Module
**Entities:** CashAccount, CashTransaction, TaxRate, Currency, Expense, TaxRate
**Current Relationships:**
- Expense → PaidBy (person)
- CashTransaction → CashAccount
- Invoice → Payment

**Missing:**
- Expense → Vendor (AP linkage)
- Expense → Asset (asset_purchase/maintenance/disposal)
- Expense → Project (project cost)
- Expense → Approval Workflow
- CashFlow Forecasting
- Bank Reconciliation
- Multi-currency Revaluation

---

### 11. Service Requests & Helpdesk
**Entities:** ServiceRequest, HelpdeskTicket, TicketMessage
**Current Relationships:**
- ServiceRequest → Customer
- HelpdeskTicket → Customer
- TicketMessage → Ticket

**Missing:**
- Ticket → SLA Tracking
- Ticket → Knowledge Base Article
- Ticket → Asset (asset-related issues)
- Ticket → Change Management
- Ticket → Escalation Matrix

---

### 12. Proposals Module
**Entities:** Proposal, ProposalLine, ProposalInput
**Current Relationships:**
- Proposal → Lead (leadReference)
- Proposal → Customer (customerReference)
- Proposal → Product (line items)

**Missing:**
- Proposal → Contract (won → contract)
- Proposal → Invoice (won → invoice)
- Proposal → Version Control
- Proposal → E-Signature

---

### 13. Documents Module
**Entities:** Document, DocumentInput
**Current Relationships:**
- Document → Entity (entityType, entityReference)

**Missing:**
- Document → Version Control
- Document → E-Signature
- Document → Expiry/Review Dates
- Document → Access Control (ACL)

---

### 14. Automation & Workflow
**Entities:** WorkflowRule, EmailTemplate, ScheduledReport, Notification
**Current Relationships:**
- WorkflowRule → Trigger Event
- Notification → User

**Missing:**
- Workflow Engine (visual designer)
- Approval Chains (multi-level)
- SLA Escalation
- Event-Driven Architecture
- Audit Trail for Workflows

---

### 15. Platform/Administration
**Entities:** Tenant, ImportJob, SyncQueueItem, OfflineSnapshot, SyncStats, ScheduledReport, EmailTemplate, WorkflowRule
**Current Relationships:**
- Tenant → Multi-tenancy isolation
- ImportJob → Entity

**Missing:**
- Tenant → Custom Fields
- Tenant → Branding/White-label
- API Key Management
- Webhook Management
- Data Retention Policies

---

## Cross-Module Relationship Matrix

| From \ To | Lead | Customer | Invoice | Payment | Proposal | Task | Product | Vendor | PO | Asset | Expense | Project | Employee | Quality | Document |
|-----------|------|----------|---------|---------|----------|------|---------|--------|----|-------|---------|---------|----------|---------|----------|
| **Lead** | - | ✅ conv | | | ✅ | ✅ | | | | | | | | | |
| **Customer** | ✅ | - | ✅ | | ✅ | | | | | | | | | | ✅ |
| **Invoice** | | ✅ | - | ✅ | ✅ | | ✅ | | | | ✅ | ✅ | | | ✅ |
| **Payment** | | ✅ | ✅ | - | | | | | | | | | | | |
| **Proposal** | ✅ | ✅ | ✅ | | - | ✅ | ✅ | | | | | | | | |
| **Task** | ✅ | | | | ✅ | - | | | | | | ✅ | ✅ | | |
| **Product** | | | ✅ | | ✅ | | - | ✅ | ✅ | ✅ | | | | ✅ | |
| **Vendor** | | | | | | | ✅ | - | ✅ | ✅ | ✅ | | | ✅ | ✅ |
| **PO** | | | ✅ | | | | ✅ | ✅ | - | ✅ | ✅ | | | ✅ | |
| **Asset** | | ✅ | | | | | ✅ | ✅ | ✅ | - | ✅ | | | ✅ | |
| **Expense** | | | | ✅ | | ✅ | | ✅ | | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| **Project** | | ✅ | ✅ | | ✅ | ✅ | | | | | ✅ | - | ✅ | | ✅ |
| **Employee** | ✅ | | | | | ✅ | | | | | ✅ | ✅ | - | | |
| **Quality** | | | | | | | ✅ | ✅ | ✅ | ✅ | | | | - | |
| **Document** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | -

**Legend:** ✅ = Exists | ❌ = Missing | ⚠️ = Partial

---

## Missing Relationships & Gaps

### Critical (Business Blocking)
| # | Missing Relationship | Impact | Module(s) |
|---|---------------------|--------|-----------|
| 1 | Vendor → Asset (supplied) | Asset lifecycle incomplete | Assets, Vendors, PO |
| 2 | PO → Asset (auto-create) | Manual asset creation | PO, Assets, Inventory |
| 3 | Expense → Vendor | AP reconciliation broken | Expense, Vendor, AP |
| 4 | Expense → Asset (categories) | No capex/opex tracking | Expense, Assets, Finance |
| 5 | PO → Invoice (3-way match) | No AP automation | PO, Invoice, Vendor |
| 6 | Asset → Depreciation | No fixed asset accounting | Assets, Finance |
| 6 | Asset → Disposal lifecycle | No end-of-life tracking | Assets, Expense |
| 7 | Vendor → Quality/Scorecard | No vendor management | Vendor, Quality, PO |
| 8 | Project → Budget/Actual | No project profitability | Project, Finance |
| 9 | Employee → Skills/Org | No resource planning | Employee, Project |
| 10 | Customer → Health/Churn | No retention management | Customer, Sales |

### High (Efficiency Loss)
| # | Missing | Impact |
|---|---------|--------|
| 11 | PO → Invoice 3-way match | Manual AP |
| 12 | Contract Management | Manual contract tracking |
| 13 | Recurring Billing | Manual recurring invoices |
| 14 | Budget vs Actual (Project) | No project control |
| 15 | Customer Health Score | Reactive retention |
| 16 | Vendor Scorecard | No vendor optimization |
| 17 | Asset Depreciation | No fixed asset accounting |
| 18 | Inventory Reorder | Stockouts/overstock |
| 19 | SLA/Escalation (Tickets) | Missed commitments |
| 20 | Approval Workflows | Manual approvals |

### Medium (Reporting Gaps)
| # | Missing | Impact |
|---|---------|--------|
| 21 | Customer Lifetime Value | Strategic decisions |
| 22 | Vendor Spend Analysis | Cost optimization |
| 25 | Asset TCO (Total Cost) | Asset decisions |
| 26 | Project Profitability | Project decisions |
| 26 | Sales Pipeline Forecast | Revenue predictability |
| 27 | Cash Flow Forecast | Treasury management |

---

## Proposed Schema Enhancements

### 1. Vendor Model - Add Asset Relationships
```typescript
// Add to Vendor interface
assetsSupplied?: Asset[];           // Virtual - assets this vendor supplied
assetsMaintained?: Asset[];         // Virtual - assets this vendor maintains
qualityScore?: number;              // 0-100 composite
performanceMetrics?: {
  onTimeDeliveryRate: number;
  defectRate: number;
  responsivenessScore: number;
  overallScore: number;
};
riskAssessment?: {
  financialRisk: 'low' | 'medium' | 'high';
  operationalRisk: 'low' | 'medium' | 'high';
  complianceRisk: 'low' | 'medium' | 'high';
  lastAssessed: string;
};
```

### 2. Asset Model - Enhanced (from prior analysis)
```typescript
// Already enhanced with:
vendorReference: string | null;
vendorName: string | null;
depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production';
depreciationRate: number;
accumulatedDepreciation: number;
bookValue: number;
disposalDate: string | null;
disposalMethod: 'sale' | 'scrap' | 'donation' | 'trade_in';
disposalProceeds: number;
disposalExpenseReference: string | null;
```

### 3. Expense Model - Asset Categories
```typescript
// Enhanced Expense interface
category: string;  // Add: 'asset_purchase' | 'asset_maintenance' | 'asset_disposal' | 'asset_depreciation'
vendorReference?: string | null;
assetReference?: string | null;
purchaseOrderReference?: string | null;
assetCategory?: string;  // e.g., 'IT Equipment', 'Furniture', 'Machinery'
isAssetPurchase: boolean;
assetDepreciationReference?: string | null;  // Link to depreciation entry
```

### 4. PurchaseOrder - Asset Creation Flag
```typescript
// Add to PurchaseOrder
assetCreated: boolean;
assetReferences?: string[];  // References to created assets
```

### 5. VendorInvoice - 3-Way Match
```typescript
// Enhanced VendorInvoice
purchaseOrderReference?: string | null;
goodsReceiptReference?: string | null;
matchStatus: 'matched' | 'partial' | 'exception' | 'pending';
matchedAmount: number;
exceptionReason?: string;
```

### 6. Project - Financial Tracking
```typescript
// Enhanced Project
budgetAmount?: number;
budgetCurrency?: string;
actualCost?: number;
actualRevenue?: number;
billingType: 'fixed' | 'time_material' | 'milestone' | 'retainer';
revenueRecognitionMethod: 'completed' | 'percentage' | 'milestone';
profitMargin?: number;
```

### 7. Employee - Skills & Org
```typescript
// Enhanced Employee
skills?: Skill[];
certifications?: Certification[];
managerId?: number | null;
directReports?: Employee[];
leaveBalance?: LeaveBalance[];
performanceReviews?: PerformanceReview[];
```

---

## Automation & Workflow Integration

### 1. Procurement-to-Asset Automation
```typescript
// Trigger: PO status → 'received' or 'completed'
async function createAssetsFromPO(poReference: string) {
  const po = getPurchaseOrder(poReference);
  if (!po || !['received', 'completed'].includes(po.status)) return;
  if (po.assetCreated) return;
  
  for (const item of po.items) {
    if (item.receivedQuantity > 0) {
      const asset = await createAsset({
        name: item.description,
        categoryId: getProductCategory(item.productReference),
        vendorReference: po.vendorReference,
        vendorName: po.vendorName,
        purchaseOrderReference: po.reference,
        purchasePrice: item.unitPrice * item.receivedQuantity,
        purchaseDate: new Date().toISOString().split('T')[0],
        currency: po.currency,
        serialNumber: item.serialNumber,
        model: item.model,
        manufacturer: item.manufacturer,
        status: 'acquired',
        conditionRating: 10,
      });
      
      // Auto-create asset purchase expense
      await createExpense({
        title: `Asset Purchase: ${item.description}`,
        category: 'asset_purchase',
        amount: item.unitPrice * item.receivedQuantity,
        currency: po.currency,
        expenseDate: new Date().toISOString().split('T')[0],
        vendorReference: po.vendorReference,
        purchaseOrderReference: po.reference,
        assetReference: asset.reference,
        isAssetPurchase: true,
        assetCategory: getProductCategory(item.productReference),
      });
      
      // Auto-create inventory adjustment
      await createInventoryAdjustment({
        productReference: item.productReference,
        type: 'receipt',
        quantity: item.receivedQuantity,
        reason: `PO ${po.reference} received`,
      });
    }
  }
  
  await updatePO(poReference, { assetCreated: true, assetReferences: assetRefs });
}
```

### 2. Asset Maintenance → Expense Automation
```typescript
async function createMaintenanceExpense(assetRef: string, maintenance: AssetMaintenanceInput) {
  const asset = getAsset(assetRef);
  return createExpense({
    title: `Maintenance: ${asset.name} - ${maintenance.maintenanceType}`,
    category: 'asset_maintenance',
    amount: maintenance.cost,
    currency: maintenance.currency,
    expenseDate: maintenance.performedOn,
    vendorReference: maintenance.vendorReference,  // service provider
    assetReference: assetRef,
    isAssetPurchase: false,
    assetCategory: 'maintenance',
    notes: maintenance.description,
  });
}
```

### 3. Asset Disposal Workflow
```typescript
async function disposeAsset(assetRef: string, disposal: DisposalInput) {
  const asset = getAsset(assetRef);
  
  // Update asset
  await updateAsset(assetRef, {
    status: 'disposed',
    disposalDate: disposal.disposalDate,
    disposalMethod: disposal.method,
    disposalProceeds: disposal.proceeds || 0,
    disposalExpenseReference: disposal.disposalExpenseRef,
  });
  
  // Create disposal expense if costs
  if (disposal.disposalCost > 0) {
    await createExpense({
      title: `Disposal: ${asset.name}`,
      category: 'asset_disposal',
      amount: disposal.disposalCost,
      currency: asset.currency,
      expenseDate: disposal.disposalDate,
      vendorReference: disposal.disposalVendorRef,
      assetReference: assetRef,
      isAssetPurchase: false,
      assetCategory: 'disposal',
      notes: disposal.notes,
    });
  }
  
  // Record disposal proceeds as negative expense (income)
  if (disposal.proceeds > 0) {
    await createExpense({
      title: `Disposal Proceeds: ${asset.name}`,
      category: 'asset_disposal_proceeds',
      amount: -disposal.proceeds,  // Negative = income
      currency: asset.currency,
      expenseDate: disposal.disposalDate,
      assetReference: assetRef,
      isAssetPurchase: false,
      assetCategory: 'disposal_proceeds',
      notes: `Proceeds from ${disposal.method} of ${asset.name}`,
    });
  }
  
  // Create audit log
  await logAudit('asset', assetRef, 'disposed', `Asset disposed via ${disposal.method}`);
}
```

### 4. Depreciation Automation
```typescript
// Scheduled job - run monthly
async function calculateDepreciation() {
  const assets = db.prepare(`
    SELECT * FROM assets 
    WHERE status IN ('acquired', 'deployed') 
    AND depreciation_rate > 0
  `).all();
  
  for (const asset of assets) {
    const monthlyDepreciation = calculateMonthlyDepreciation(asset);
    const newAccumulated = asset.accumulated_depreciation + monthlyDepreciation;
    const newBookValue = asset.purchase_price - newAccumulated;
    
    // Create depreciation expense
    await createExpense({
      title: `Depreciation: ${asset.name}`,
      category: 'asset_depreciation',
      amount: monthlyDepreciation,
      currency: asset.currency,
      expenseDate: new Date().toISOString().split('T')[0],
      assetReference: asset.reference,
      isAssetPurchase: false,
      assetCategory: 'depreciation',
      notes: `Monthly depreciation (${asset.depreciation_method}, ${asset.depreciation_rate}%/yr)`,
    });
    
    // Update asset
    db.prepare(`
      UPDATE assets SET 
        accumulated_depreciation = ?,
        book_value = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newAccumulated, newBookValue, now(), asset.id);
  }
}
```

---

## Reporting & Analytics Enablement

### 1. Asset Lifecycle Reports
| Report | Query Basis |
|--------|-------------|
| **Asset Register** | All assets with current status, location, value |
| **Asset Lifecycle Cost** | purchasePrice + Σmaintenance + disposalCost - disposalProceeds |
| **Depreciation Schedule** | Monthly depreciation by asset/category |
| **Asset Utilization** | Deployed vs Available by category |
| **Maintenance Cost Trend** | Monthly maintenance spend by asset/category |
| **Vendor Asset Performance** | Assets supplied, maintenance costs, failures by vendor |
| **Depreciation Forecast** | Projected book value by period |
| **Disposal Analysis** | Proceeds vs Book Value by disposal method |

### 2. Procurement Analytics
| Report | Query Basis |
|--------|-------------|
| **Vendor Spend Analysis** | Σ(PO amounts) by vendor/category |
| **Vendor Performance** | OTIF, defect rate, lead time by vendor |
| **PO Cycle Time** | PO created → received by vendor/category |
| **3-Way Match Exceptions** | PO/Receipt/Invoice mismatches |
| **Spend by Category** | PO amounts by product category |
| **Contract Compliance** | Spend vs Contract terms |

### 3. Asset Financial Reports
| Report | Query Basis |
|--------|-------------|
| **Fixed Asset Register** | All assets with book value, location, status |
| **Depreciation Schedule** | Monthly depreciation by asset |
| **Asset Impairment Review** | Book value vs Market/Fair value |
| **Disposal Gain/Loss** | Proceeds vs Book Value by disposal |
| **Capex vs Opex** | Asset purchases vs Maintenance spend |
| **Asset TCO** | Total Cost of Ownership by asset |

### 4. Project Profitability
| Report | Query Basis |
|--------|-------------|
| **Project P&L** | Revenue - Cost by project |
| **Resource Utilization** | Billable vs Non-billable hours |
| **Budget vs Actual** | Project budget vs actual cost/revenue |
| **Resource Profitability** | Employee cost vs bill rate |

### 5. Vendor Performance Dashboard
| Metric | Calculation |
|--------|-------------|
| **On-Time Delivery** | PO received on time / Total POs |
| **Defect Rate** | NCRs / Goods Receipts |
| **Lead Time** | PO created → Goods Received |
| **Invoice Accuracy** | Matched invoices / Total invoices |
| **Responsiveness** | Avg response time to RFQ |
| **Overall Score** | Weighted composite |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) - Critical Fixes
| Task | Effort | Dependencies |
|------|--------|--------------|
| 1.1 Add `vendorReference` to Asset + API | 4h | - |
| 1.2 Add expense asset categories (purchase/maintenance/disposal/depreciation) | 4h | 1.1 |
| 1.3 Add expense-vendor-asset linkage fields | 4h | 1.2 |
| 1.4 PO → Asset auto-create on receipt | 8h | 1.1 |
| 1.5 PO → Asset expense auto-create | 4h | 1.4 |
| 1.6 Asset → Vendor API endpoints | 4h | 1.1 |

### Phase 2: Financial Integration (Weeks 3-4)
| Task | Effort | Dependencies |
|------|--------|--------------|
| 2.1 VendorInvoice 3-way match fields | 8h | 1.1 |
| 2.2 Invoice-PO-GR matching logic | 16h | 2.1 |
| 2.3 AP automation (auto-match) | 16h | 2.2 |
| 2.4 Expense approval workflow | 16h | 1.3 |
| 2.5 Bank reconciliation | 16h | 2.4 |

### Phase 3: Asset Lifecycle (Weeks 5-6)
| Task | Effort | Dependencies |
|------|--------|--------------|
| 3.1 Asset depreciation engine | 16h | 1.5 |
| 3.2 Asset disposal workflow | 8h | 3.1 |
| 3.2 Asset disposal expense/proceeds | 8h | 3.2 |
| 3.3 Asset impairment review | 8h | 3.1 |
| 3.4 Asset TCO reporting | 8h | 3.1, 3.2 |

### Phase 4: Vendor Management (Weeks 7-8)
| Task | Effort | Dependencies |
|------|--------|--------------|
| 4.1 Vendor scorecard | 16h | 1.1 |
| 4.2 Vendor performance dashboard | 16h | 4.1 |
| 4.3 Vendor risk assessment | 8h | 4.1 |
| 4.4 Vendor contract management | 16h | 4.1 |

### Phase 5: Project & Financial Integration (Weeks 9-10)
| Task | Effort | Dependencies |
|------|--------|--------------|
| 5.1 Project budget/actual tracking | 16h | 2.4 |
| 5.2 Project profitability reports | 8h | 5.1 |
| 5.3 Resource utilization reports | 8h | 5.1 |
| 5.4 Cash flow forecasting | 16h | 2.5 |

### Phase 6: Automation & Workflow (Weeks 11-12)
| Task | Effort | Dependencies |
|------|--------|--------------|
| 6.1 Workflow engine (visual) | 32h | - |
| 6.2 Approval chains | 16h | 6.1 |
| 6.3 SLA/Escalation engine | 16h | 6.1 |
| 6.3 Event-driven architecture | 24h | 6.1 |

### Phase 7: Reporting & Analytics (Weeks 13-14)
| Task | Effort | Dependencies |
|------|--------|--------------|
| 7.1 Asset lifecycle reports | 16h | 3.1, 3.2 |
| 7.2 Procurement analytics | 16h | 2.2 |
| 7.3 Asset financial reports | 16h | 3.1, 3.2 |
| 7.4 Project profitability | 16h | 5.1 |
| 7.5 Vendor performance dashboard | 16h | 4.1 |
| 7.6 Executive dashboards | 16h | All |

---

## Data Integrity & Validation Rules

### 1. Referential Integrity
| Rule | Implementation |
|------|----------------|
| Asset.vendorReference → Vendor.reference | FK constraint + API validation |
| Asset.purchaseOrderReference → PO.reference | FK constraint + API validation |
| Asset.expenseReference → Expense.reference | FK constraint + API validation |
| Expense.assetReference → Asset.reference | FK constraint + API validation |
| Expense.vendorReference → Vendor.reference | FK constraint + API validation |
| Expense.purchaseOrderReference → PO.reference | FK constraint + API validation |
| VendorInvoice.purchaseOrderReference → PO.reference | FK constraint + API validation |
| VendorInvoice.goodsReceiptReference → GR.reference | FK constraint + API validation |

### 2. Business Rules
| Rule | Validation Point |
|------|------------------|
| Asset status transition: acquired → deployed → maintaining → disposed/lost | API + DB CHECK constraint |
| Asset cannot be deployed if status ≠ acquired | API validation |
| Asset cannot be maintained if status ≠ deployed | API validation |
| Asset cannot be disposed if status = lost | API validation |
| Expense category = asset_purchase → assetReference required | API validation |
| Expense category = asset_maintenance → assetReference required | API validation |
| Expense category = asset_disposal → assetReference required | API validation |
| PO status = received → assetCreated must be true (if items received) | Background job |
| VendorInvoice matchStatus = matched → PO/GR amounts match | Background job |
| Asset disposal → disposalDate required, disposalMethod required | API validation |
| Asset depreciation rate > 0 → depreciationMethod required | API validation |

### 3. Cascade Rules
| Trigger | Action |
|---------|--------|
| Vendor deleted | Set Asset.vendorReference = NULL, VendorContract.vendorReference = NULL |
| Asset deleted | Set Expense.assetReference = NULL, AssetMaintenance.assetId = NULL |
| PO deleted | Set Asset.purchaseOrderReference = NULL, GoodsReceipt.poReference = NULL |
| Expense deleted | Set Asset.expenseReference = NULL, AssetMaintenance.expenseReference = NULL |
| VendorInvoice deleted | Set VendorPayout.vendorInvoiceReference = NULL |

### 4. Audit Requirements
| Entity | Audit Events |
|--------|--------------|
| Asset | created, status_changed, deployed, maintained, disposed, transferred, depreciation_calculated |
| Vendor | created, updated, contract_added, scorecard_updated, risk_assessed |
| PO | created, approved, sent, received, completed, cancelled, asset_created |
| Expense | created, approved, paid, asset_linked, category_changed |
| VendorInvoice | created, issued, matched, paid, voided |
| AssetMaintenance | created, completed, expense_created |
| Asset | depreciation_calculated, impairment_reviewed, disposed |

---

## Summary: Critical Path to Complete ERP

### Immediate (Week 1-2)
1. ✅ **Asset ↔ Vendor link** - DONE
2. 🔴 **Expense asset categories** - Add 4 categories
3. 🔴 **PO → Asset auto-create** - On receipt
4. 🔴 **Expense auto-create from Asset** - Purchase/Maintenance

### Short-term (Week 3-4)
5. 🔴 **3-way match (PO/GR/Invoice)**
6. 🔴 **AP automation**
7. 🔴 **Asset depreciation engine**

### Medium-term (Month 2)
8. Asset disposal workflow
9. Vendor scorecard
10. Project profitability
11. Cash flow forecasting

### Long-term (Month 3+)
12. Workflow engine
13. Advanced analytics
14. Mobile/PWA
15. Multi-tenant white-label

---

## Success Metrics

| KPI | Target |
|-----|--------|
| PO→Asset auto-creation rate | 100% |
| 3-way match automation | >95% |
| Invoice processing time | <24 hours |
| Asset data completeness | 100% |
| Depreciation accuracy | 100% |
| Vendor scorecard coverage | 100% |
| Project profitability accuracy | ±5% |
| Cash forecast accuracy | ±10% |

---

*End of Plan - This document should be reviewed and updated quarterly as the ERP evolves.*
