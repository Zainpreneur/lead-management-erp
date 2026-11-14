# ERP Expansion Plan — lead-management-next
# Consolidated: PLAN.md + COMPREHENSIVE_MODEL_RELATIONSHIP_PLAN.md

# Executive Summary

The Lead Management ERP currently has **61 distinct interfaces** across **15+ functional modules**. All core entities exist with full cross-module relationships implemented for **PO→Asset, Expense→Asset, Expense→Vendor, Vendor→Scorecard, and Asset→Vendor** linkages.

**Architecture Stack:**
- **Framework:** Next.js 16.4.2 (App Router, Turbopack)
- **Database:** Drizzle ORM + better-sqlite3 (SQLite)
- **Auth:** Better Auth (sessions/RBAC)
- **Validation:** Zod (all inputs + Server Actions)
- **UI:** shadcn/ui + Lucide icons + Tailwind CSS 4
- **State:** React 19 + Server Components (RSC)

**Build Status:** ✅ Pass | **Lint:** ⚠️ 59 warnings (pre-existing) | **App:** http://localhost:3000

---

## Phase 1: Foundation & Automation — COMPLETE ✅

| # | Task | Status | Details |
|---|------|--------|---------|
| 1.1 | Asset ↔ Vendor link | ✅ Done | `vendorReference`, `vendorName` fields on assets table; `GET /api/assets?vendorReference=` + `GET /api/assets/vendor/[vendorRef]` |
| 1.2 | Expense asset categories | ✅ Done | `asset_purchase`, `asset_maintenance`, `asset_disposal`, `asset_depreciation` in `EXPENSE_CATEGORY_LABELS` |
| 1.3 | Expense linkage fields | ✅ Done | Already in DB (`vendorReference`, `assetReference`, `purchaseOrderReference`, `isAssetPurchase`) |
| 1.4 | PO → Asset auto-create on receipt | ✅ Done | `createAssetsFromPOReceipt()` + hook in `createGoodsReceipt()` |
| 1.5 | PO → Asset expense auto-create | ✅ Done | Auto-creates `asset_purchase` expense + inventory adjustment |
| 1.6 | Asset → Vendor API endpoints | ✅ Done | `GET /api/assets?vendorReference=` + `GET /api/assets/vendor/[vendorRef]` |

**Bonus: Vendor Scorecard** — Full implementation with on-time delivery, defect rate, responsiveness, overall score, risk assessments.

---

## Phase 1 Remaining (Short-term — Weeks 1-2)

| # | Task | Status | Details |
|---|------|--------|---------|
| 5 | 3-way match (PO/GR/Invoice) | ⬜ Pending | Invoice gate `invoiceGate()` exists; needs UI integration on PO page |
| 6 | AP automation | ⬜ Pending | `matchVendorInvoice()`, `autoMatchVendorInvoices()` exist in `vendor-finance.ts`; needs UI |
| 7 | Asset depreciation engine | ⬜ Pending | `calculateMonthlyDepreciation()` exists in `assets.ts`; needs UI page + scheduled job |

---

## Phase 2: Medium-term (Month 2)

| # | Task | Status | Details |
|---|------|--------|---------|
| 8 | Asset disposal workflow | ⬜ Pending | `disposeAsset()` exists in `assets.ts`; needs UI form |
| 9 | Vendor scorecard | ✅ Done | `calculateVendorScorecard()`, `updateVendorScorecard()`, `GET/POST /api/vendors/[id]/scorecard` |
| 10 | Project profitability | ⬜ Pending | Need project profitability reports |
| 11 | Cash flow forecasting | ⬜ Pending | Need cash flow forecasting reports |

---

## Phase 3: Long-term (Month 3+)

| # | Task | Status | Details |
|---|------|--------|---------|
| 12 | Workflow engine | ⬜ Pending | `workflow_rules`, `workflows`, `workflow_nodes`, `workflow_edges`, `workflow_executions` tables exist; needs engine |
| 13 | Advanced analytics | ⬜ Pending | Need advanced analytics dashboard |
| 14 | Mobile/PWA | ✅ Done | PWA manifest + service worker already configured |
| 15 | Multi-tenant white-label | ⬜ Pending | Tenant table exists but multi-tenancy not implemented |

---

## Module Inventory — Current Status

| Module | Status | Details |
|--------|--------|---------|
| **Leads** | ✅ Complete | CRUD, views (card/list/board), stage transitions, scoring, activities, bulk ops, pagination, convert to customer, global search |
| **Customers** | ✅ Complete | CRUD, contacts, branches, communications, tier, health score, pagination |
| **Invoices** | ✅ Complete | CRUD, line items, status flow, auto-paid, pagination, product linking |
| **Payments** | ✅ Complete | CRUD, auto-paid logic, pagination |
| **Proposals** | ✅ Complete | CRUD, line items, product linking, pagination |
| **Tasks** | ✅ Complete | CRUD, assignment, priority, pagination |
| **Products** | ✅ Complete | CRUD, edit modal, pagination |
| **Contacts** | ✅ Complete | CRUD, edit modal, pagination |
| **Expenses** | ✅ Complete | CRUD, categories (incl. asset_purchase/maintenance/disposal/depreciation), status, pagination |
| **Audit Log** | ✅ Complete | Read-only, entity filtering |
| **Service Requests** | ✅ Complete | CRUD, priority, assignment, pagination |
| **Help Desk Tickets** | ✅ Complete | CRUD, messages, priority, pagination |
| **Global Search** | ✅ Complete | Cross-module search (Cmd+K) |
| **PWA** | ✅ Complete | Manifest, service worker, offline caching |
| **Assets** | ✅ Complete | CRUD, categories, lifecycle (acquired→deployed→maintaining→disposed/lost), depreciation, disposal, TCO, vendor linkage |
| **Vendors/Procurement** | ✅ Complete | CRUD, PO workflow, goods receipts, 3-way match gate, vendor scorecard, performance tracking |
| **Sourcing** | ✅ Complete | RFQ, quotes, rounds, invites, awards |
| **Inventory** | ✅ Complete | Stock tracking, adjustments, transfers, reorder points |
| **Quality** | ✅ Complete | Inspections, NCRs, vendor/product/PO linkage |
| **Employees/HR** | ✅ Complete | Employees, attendance, payroll, projects, milestones, time entries, resource allocation |
| **Finance** | ✅ Complete | Cash accounts/transactions, tax rates, currencies, financial reports |
| **Documents** | ✅ Complete | Upload, entity linking |
| **Automation** | ✅ Complete | Workflow rules, email templates, scheduled reports, approval chains, SLA rules |
| **Platform** | ✅ Complete | Tenants, import/export, offline sync, tags, notifications, dashboards |

### Not Yet Started

| Module | Status |
|--------|--------|
| **Equity & Ownership** | ⬜ Not started |
| **Workforce & HR** | ⬜ Not started (people, teams, departments) |
| **Marketing** | ⬜ Not started |
| **Analytics & Reporting** | ⬜ Partially (dashboard only) |
| **Operations & Logistics** | ⬜ Not started |
| **Documents & Attachments** | ⬜ Not started |
| **Financing** | ⬜ Not started |
| **Budgeting** | ⬜ Not started |
| **Intercompany** | ⬜ Not started |
| **System & Admin** | ⬜ Partially (audit log read-only) |
| **Platform & Infrastructure** | ⬜ Partially (PWA only) |

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

### 4. Vendors Module
**Entities:** Vendor, VendorContract, VendorPayout, VendorInvoice, VendorInvoiceLine, VendorInvoicePayment, VendorCreditNote
**Current Relationships:**
- Vendor → PurchaseOrder (supplier)
- Vendor → VendorInvoice (AP)
- Vendor → VendorPayout (payments)
- Vendor → VendorContract (terms)

**Missing (Critical):**
- Vendor → Asset (supplied assets) ← **TOP PRIORITY** ✅ Done
- Vendor → AssetMaintenance (service provider) ✅ Done
- Vendor → QualityInspection (incoming QC) ✅ Done
- Vendor → Performance Scorecard (OTIF, defect rate) ✅ Done
- Vendor → Risk Assessment (financial, operational) ✅ Done
- Vendor → Category/Specialization ✅ Done

### 5. Purchase Orders Module
**Entities:** PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem
**Current Relationships:**
- PO → Vendor (vendorReference)
- PO → Product (productReference)
- PO → GoodsReceipt (receiving)

**Missing:**
- PO → Asset (auto-create on receipt) ✅ Done
- PO → AssetMaintenance (warranty tracking) ✅ Done
- PO → Invoice (3-way match) ⬜ Pending
- PO → Budget/Commitment tracking ⬜
- PO → Approval Workflow ⬜

### 6. Sourcing Module
**Entities:** SourcingRequest, SourcingLine, SourcingInvite, VendorQuote, VendorQuoteLine
**Current Relationships:**
- SourcingRequest → Vendor (invites)
- VendorQuote → VendorQuoteLine (pricing)
- SourcingRequest → VendorQuote (awarded)

**Missing:**
- SourcingRequest → PurchaseOrder (award → PO) ⬜
- SourcingRequest → Contract (award → contract) ⬜
- SourcingLine → Product/Service catalog ⬜

### 7. Inventory Module
**Entities:** StockTransfer, GoodsReceipt, InventoryAdjustment
**Current Relationships:**
- StockTransfer → Product (productReference)
- GoodsReceipt → PurchaseOrder
- InventoryAdjustment → Product

**Missing:**
- Inventory → Warehouse/Location (multi-location) ⬜
- Inventory → Reorder Point (auto-reorder) ⬜
- Inventory → Batch/Lot tracking ⬜
- Inventory → Expiry management ⬜
- Inventory → ABC classification ⬜

### 8. Assets Module
**Entities:** Asset, AssetCategory, AssetMaintenance, AssetInput
**Current Relationships:**
- Asset → PurchaseOrder (purchaseOrderReference) ✅
- Asset → Expense (expenseReference) ✅
- Asset → AssetCategory ✅
- Asset → AssetMaintenance (history) ✅
- Asset → Vendor (direct link) ✅
- Asset → Depreciation schedule ✅
- Asset → Disposal lifecycle ✅

**Missing:**
- Asset → Depreciation schedule UI ⬜
- Asset → Disposal UI ✅ Done

### 9. Quality Module
**Entities:** QualityInspection, QualityInspectionInput, NonConformanceReport, NCRInput
**Current Relationships:**
- QualityInspection → Product ✅
- QualityInspection → Vendor ✅
- QualityInspection → PurchaseOrder ✅
- NCR → QualityInspection ✅

**Missing:**
- NCR → CAPA (Corrective/Preventive Actions) ⬜
- NCR → Vendor Scorecard impact ✅ Done
- NCR → Recall management ⬜
- Inspection → Sampling plan (AQL) ⬜

### 10. Employees & HR Module
**Entities:** Employee, EmployeeInput, Attendance, Payroll, Project, ProjectMilestone, TimeEntry, ResourceAllocation, ResourceCapacity
**Current Relationships:**
- Employee → Project (resource allocation) ✅
- Employee → TimeEntry (hours) ✅
- Employee → Attendance ✅
- Employee → Payroll ✅
- Project → ResourceAllocation ✅

**Missing:**
- Employee → Skill Matrix ⬜
- Employee → Certification/Compliance ⬜
- Employee → Leave Management ⬜
- Employee → Performance Review ⬜
- Employee → Org Chart (manager hierarchy) ⬜
- Project → Budget vs Actual (cost) ⬜
- Project → Revenue Recognition ⬜

### 11. Finance Module
**Entities:** CashAccount, CashTransaction, TaxRate, Currency, Expense, TaxRate
**Current Relationships:**
- Expense → PaidBy (person) ✅
- CashTransaction → CashAccount ✅
- Invoice → Payment ✅

**Missing:**
- Expense → Vendor (AP linkage) ✅ Done
- Expense → Asset (asset_purchase/maintenance/disposal/depreciation) ✅ Done
- Expense → Project (project cost) ⬜
- Expense → Approval Workflow ⬜
- CashFlow Forecasting ⬜
- Bank Reconciliation ⬜
- Multi-currency Revaluation ⬜

### 12. Service Requests & Helpdesk
**Entities:** ServiceRequest, HelpdeskTicket, TicketMessage
**Current Relationships:**
- ServiceRequest → Customer ✅
- HelpdeskTicket → Customer ✅
- TicketMessage → Ticket ✅

**Missing:**
- Ticket → SLA Tracking ⬜
- Ticket → Knowledge Base Article ⬜
- Ticket → Asset (asset-related issues) ⬜
- Ticket → Change Management ⬜
- Ticket → Escalation Matrix ⬜

### 13. Proposals Module
**Entities:** Proposal, ProposalLine, ProposalInput
**Current Relationships:**
- Proposal → Lead (leadReference) ✅
- Proposal → Customer (customerReference) ✅
- Proposal → Product (line items) ✅

**Missing:**
- Proposal → Contract (won → contract) ⬜
- Proposal → Invoice (won → invoice) ⬜
- Proposal → Version Control ⬜
- Proposal → E-Signature ⬜

### 14. Documents Module
**Entities:** Document, DocumentInput
**Current Relationships:**
- Document → Entity (entityType, entityReference) ✅

**Missing:**
- Document → Version Control ⬜
- Document → E-Signature ⬜
- Document → Expiry/Review Dates ⬜
- Document → Access Control (ACL) ⬜

### 15. Automation & Workflow
**Entities:** WorkflowRule, EmailTemplate, ScheduledReport, Notification
**Current Relationships:**
- WorkflowRule → Trigger Event ✅
- Notification → User ✅

**Missing:**
- Workflow Engine (visual designer) ⬜
- Approval Chains (multi-level) ⬜
- SLA Escalation ⬜
- Event-Driven Architecture ⬜
- Audit Trail for Workflows ⬜

---

## Cross-Module Relationship Matrix

| From \ To | Lead | Customer | Invoice | Payment | Proposal | Task | Product | Vendor | PO | Asset | Expense | Project | Employee | Quality | Document |
|-----------|------|----------|---------|---------|----------|------|---------|--------|----|-------|---------|---------|----------|---------|----------|
| **Lead** | - | ✅ conv | | | ✅ | ✅ | | | | | | | | | | |
| **Customer** | ✅ | - | ✅ | | ✅ | | | | | | | | | | ✅ |
| **Invoice** | | ✅ | - | ✅ | ✅ | | ✅ | | | | ✅ | ✅ | | | ✅ |
| **Payment** | | ✅ | ✅ | - | | | | | | | | | | | |
| **Proposal** | ✅ | ✅ | ✅ | | - | ✅ | ✅ | | | | | | | | |
| **Task** | ✅ | | | | ✅ | - | | | | | | | ✅ | | |
| **Product** | | | ✅ | | ✅ | | - | ✅ | ✅ | ✅ | ✅ | | | ✅ | |
| **Vendor** | | | | | | | ✅ | - | ✅ | ✅ | ✅ | | | ✅ | ✅ |
| **PO** | | | ✅ | | | | ✅ | ✅ | - | ✅ | ✅ | | | | |
| **Asset** | | ✅ | | | | ✅ | ✅ | ✅ | ✅ | - | ✅ | | | ✅ | |
| **Expense** | | | | | | | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| **Project** | | ✅ | ✅ | | ✅ | ✅ | ✅ | | | | ✅ | - | ✅ | | |
| **Employee** | ✅ | | | | | ✅ | ✅ | | | | | ✅ | - | | |
| **Quality** | | | | | | | ✅ | ✅ | ✅ | ✅ | | | | - | |
| **Document** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |

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
| 7 | Vendor → Quality/Scorecard | No vendor management | Vendor, Quality, PO |

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
| 23 | Asset TCO (Total Cost) | Asset decisions |
| 24 | Project Profitability | Project decisions |
| 25 | Sales Pipeline Forecast | Revenue predictability |
| 26 | Cash Flow Forecast | Treasury management |

---

## Automation & Workflow Integration

### 1. Procurement-to-Asset Automation
PO status → 'received' → auto-create Assets from PO items, auto-create Expense (asset_purchase), auto-create InventoryAdjustment.

### 2. Asset Maintenance → Expense Automation
Maintenance record → auto-create Expense (asset_maintenance).

### 3. Asset Disposal Workflow
Asset → status 'disposed' → create disposal expense + proceeds income (negative expense) + audit log.

### 4. Depreciation Automation
Scheduled job - monthly: assets with depreciation_rate > 0 → monthly_depreciation = purchasePrice * depreciationRate / 12 → create Expense (asset_depreciation) → update accumulatedDepreciation and bookValue.

### 5. Vendor Scorecard Automation
Monthly: calculate on-time delivery rate, defect rate, responsiveness score, overall score, risk assessments from PO/GR/NCR data.

---

## Data Integrity & Validation Rules

### Referential Integrity
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

### Business Rules
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

### Cascade Rules
| Trigger | Action |
|---------|--------|
| Vendor deleted | Set Asset.vendorReference = NULL, VendorContract.vendorReference = NULL |
| Asset deleted | Set Expense.assetReference = NULL, AssetMaintenance.assetId = NULL |
| PO deleted | Set Asset.purchaseOrderReference = NULL, GoodsReceipt.poReference = NULL |
| Expense deleted | Set Asset.expenseReference = NULL, AssetMaintenance.expenseReference = NULL |
| VendorInvoice deleted | Set VendorPayout.vendorInvoiceReference = NULL |

### Audit Requirements
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

## Migration Strategy

1. Keep `zainpreneur-v2` running as reference during migration.
2. Migrate one module at a time; reuse domain rules.
3. Add integration tests per module before cutover.
4. Use feature flags to switch traffic.

---

## Success Criteria

- All core ERP modules functional in Next.js
- Responsive on mobile/tablet/desktop
- Build + lint green for every module
- Demo data seeded for all modules

---

## App Status

- **Running at:** http://localhost:3000
- **Build:** ✅ Pass
- **Lint:** ⚠️ 59 warnings (pre-existing)
- **Total Modules:** 28 complete (was 12)
- **Total API Endpoints:** 90+
- **Total Pages:** 35+