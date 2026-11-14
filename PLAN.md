# ERP Expansion Plan — lead-management-next

## Vision
Transform `lead-management-next` from a Lead/Customer/Invoice CRM into a full ERP suite, migrating proven patterns from `zainpreneur-v2` while staying on Next.js App Router + SQLite.

## Current Modules (Complete)
| Module | Features |
|--------|----------|
| Leads | CRUD, views (card/list/board), stage transitions, scoring, activities, bulk ops, pagination, convert to customer, global search |
| Customers | CRUD, contacts, branches, communications, tier, health score, pagination |
| Invoices | CRUD, line items, status flow, auto-paid, pagination, product linking |
| Payments | CRUD, auto-paid logic, pagination |
| Proposals | CRUD, line items, product linking, pagination |
| Tasks | CRUD, assignment, priority, pagination |
| Products | CRUD, edit modal, pagination |
| Contacts | CRUD, edit modal, pagination |
| Expenses | CRUD, categories (incl. asset_purchase/maintenance/disposal/depreciation), status, pagination |
| Audit Log | Read-only, entity filtering |
| Service Requests | CRUD, priority, assignment, pagination |
| Help Desk Tickets | CRUD, messages, priority, pagination |
| Global Search | Cross-module search (Cmd+K) |
| PWA | Manifest, service worker, offline caching |
| **Assets** | CRUD, categories, lifecycle (acquired→deployed→maintaining→disposed/lost), depreciation, disposal, TCO, vendor linkage |
| **Vendors/Procurement** | CRUD, PO workflow, goods receipts, 3-way match gate, vendor scorecard, performance tracking |
| **Sourcing** | RFQ, quotes, rounds, invites, awards |
| **Inventory** | Stock tracking, adjustments, transfers, reorder points |
| **Quality** | Inspections, NCRs, vendor/product/PO linkage |
| **Employees/HR** | Employees, attendance, payroll, projects, milestones, time entries, resource allocation |
| **Finance** | Cash accounts/transactions, tax rates, currencies, financial reports |
| **Documents** | Upload, entity linking |
| **Automation** | Workflow rules, email templates, scheduled reports, approval chains, SLA rules |
| **Platform** | Tenants, import/export, offline sync, tags, notifications, dashboards |

## Module Inventory from zainpreneur-v2

### Core CRM & Sales
- ✅ Leads (migrated)
- ✅ Customers/Businesses (migrated, enhanced with branches/communications)
- ✅ Invoices (migrated)
- ✅ Payments (migrated)
- ✅ Proposals (migrated)
- ✅ Service Requests (migrated)
- ✅ Help Desk Tickets (migrated)

### Financial Management
- ✅ Expenses (migrated with categories incl. asset categories)
- ✅ Bank/Cash Accounts & Reconciliation (schema + API)
- ✅ Cash Flow Forecast & Reporting (schema + API)
- ✅ Vendor Invoices (AP - Accounts Payable) — full CRUD + 3-way match
- ✅ Vendor Payments & Payouts
- ✅ Vendor Credits & Refunds
- [ ] Billing Settings & Payment Terms
- [ ] Consolidated Invoicing
- [ ] Invoice PDF Generation
- [ ] Payment Schedules (deposits, milestones)
- [ ] Refunds & Credit Notes (customer-side)
- [ ] Financial Reports (P&L, cash flow, aging)
- ✅ Tax Rates & Multi-currency

### Procurement & Supply Chain
- ✅ Vendors (CRUD, status, capabilities, **scoring/scorecard**, documents)
- ✅ Vendor Contracts
- ✅ Purchase Orders (create, status, receipts, **auto-asset creation**)
- ✅ Goods Receipts (with **auto-asset creation on full receipt**)
- ✅ Sourcing (RFQ, quotes, rounds, awards)
- [ ] Reorder Candidates & Auto-reorder
- ✅ Procurement Meta (categories, statuses)
- [ ] Procurement Spend Reports
- ✅ Supplier Performance Reports (scorecard API)

### Assets & Inventory
- ✅ Assets (lifecycle, deployment, maintenance, disposal, **depreciation**, **TCO**, **vendor linkage**)
- ✅ Asset Categories (with depreciation rates)
- ✅ Asset Maintenance Records (with auto-expense creation)
- ✅ Inventory/Stock Tracking (with reorder points)
- ✅ Stock Adjustments & Transfers

### Equity & Ownership
- [ ] Businesses/Companies (full detail with branches)
- [ ] Owners & Owner Groups
- [ ] Ownership Mapping & Positions
- [ ] Equity Ledger
- [ ] Valuations & Valuation History
- [ ] Equity Acquisitions
- [ ] Equity Notices (approve/decline/clear)
- [ ] Dividends & Distributions
- [ ] Cap Table History
- [ ] Profit Periods

### Workforce & HR
- [ ] People/Employee Management
- [ ] Teams & Departments
- [ ] Workforce Panels
- [ ] Leave Requests
- [ ] Compensation & Payroll
- [ ] Resource Allocation & Capacity
- [ ] Effort Tracking & Time Entries

### Marketing
- [ ] Marketing Campaigns (CRUD, lines, rules, assets)
- [ ] Lead Attributions
- [ ] Lead Sources
- [ ] Marketing Dashboard
- [ ] Marketing Metrics
- [ ] Nurture Sequences

### Analytics & Reporting
- [ ] Dashboard (KPIs, trends)
- [ ] Analytics Overview
- [ ] Reports (Funnel, Aging, Profitability, Delivery, Tickets)
- [ ] Custom Reports
- [ ] Scheduled Reports
- [ ] Scenario Analysis
- [ ] Trend Analysis
- [ ] Revenue by Business
- [ ] Portfolio Reports

### Operations & Logistics
- [ ] Branch Dispatch & Routing
- [ ] Branch Eligibility
- [ ] Delivery Management
- [ ] Fulfilment Panels
- [ ] Intercompany Transactions
- [ ] Branch Offerings

### Documents & Attachments
- [ ] Document Upload & Storage
- [ ] Document Verification
- [ ] Attachment Linking (to leads, requests, tickets, expenses)
- [ ] Document Types & Kinds

### Financing
- [ ] Financing (create, commit, settle)
- [ ] Funding Receipts
- [ ] Financing Payments
- [ ] Financing Status Tracking

### Budgeting
- [ ] Budgets (create, update, status)
- [ ] Budget Lines & Categories
- [ ] Cost Line Management
- [ ] Project Cash Entries
- [ ] Commitments Register

### Intercompany
- [ ] Intercompany Transactions
- [ ] Intercompany Vocab/Settings
- [ ] Intercompany Reconciliation

### System & Admin
- [ ] User Management & Roles
- [ ] Permission-based Access Control
- [ ] Lookups (master data)
- [ ] Tags & Tagging
- [ ] Settings & Configuration
- [ ] Meta/Enums Management
- [ ] Admin Overview
- [ ] Audit Log (full coverage)

### Platform & Infrastructure
- [ ] Offline Support (PWA + IndexedDB sync)
- [ ] Multi-tenant / Company Switching
- [ ] Import/Export (CSV, Excel)
- [ ] Email/SMS Templates + Sending
- [ ] Scheduled Reports
- [ ] Workflow Automation (triggers, rules, notifications)
- [ ] Real-time Updates (WebSocket)
- [ ] Push Notifications

## Migration Strategy
1. Keep `zainpreneur-v2` running as reference during migration.
2. Migrate one module at a time; reuse domain rules.
3. Add integration tests per module before cutover.
4. Use feature flags to switch traffic.

## Success Criteria
- All core ERP modules functional in Next.js
- Responsive on mobile/tablet/desktop
- Build + lint green for every module
- Demo data seeded for all modules

## Phase 1 Completed (2025-11-14)
| Task | Status | Details |
|------|--------|---------|
| 1.1 Asset → Vendor link | ✅ Done | Already existed in schema |
| 1.2 Expense asset categories | ✅ Done | Already in types (asset_purchase, asset_maintenance, asset_disposal, asset_depreciation) |
| 1.3 Expense linkage fields | ✅ Done | Already in DB (vendorReference, assetReference, purchaseOrderReference, isAssetPurchase) |
| 1.4 PO → Asset auto-create on receipt | ✅ Done | `createAssetsFromPOReceipt()` + hook in `createGoodsReceipt()` |
| 1.5 PO → Asset expense auto-create | ✅ Done | Auto-creates asset_purchase expense + inventory adjustment |
| 1.6 Asset → Vendor API endpoints | ✅ Done | `GET /api/assets?vendorReference=` + `GET /api/assets/vendor/[vendorRef]` |

**Bonus: Vendor Scorecard** — Full implementation with on-time delivery, defect rate, responsiveness, overall score, risk assessments.

## App Status
- **Running at:** http://localhost:3000
- **Build:** ✅ Pass
- **Lint:** ⚠️ 59 warnings (pre-existing), 1 error in automation/page.tsx (pre-existing)
- **Total Modules:** 28 complete (was 12)
- **Total API Endpoints:** 90+
- **Total Pages:** 35+