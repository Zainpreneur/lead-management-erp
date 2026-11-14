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
| Expenses | CRUD, categories, status, pagination |
| Audit Log | Read-only, entity filtering |
| Service Requests | CRUD, priority, assignment, pagination |
| Help Desk Tickets | CRUD, messages, priority, pagination |
| Global Search | Cross-module search (Cmd+K) |
| PWA | Manifest, service worker, offline caching |

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
- ✅ Expenses (migrated with categories)
- [ ] Bank/Cash Accounts & Reconciliation
- [ ] Cash Flow Forecast & Reporting
- [ ] Vendor Invoices (AP - Accounts Payable)
- [ ] Vendor Payments & Payouts
- [ ] Vendor Credits & Refunds
- [ ] Billing Settings & Payment Terms
- [ ] Consolidated Invoicing
- [ ] Invoice PDF Generation
- [ ] Payment Schedules (deposits, milestones)
- [ ] Refunds & Credit Notes
- [ ] Financial Reports (P&L, cash flow, aging)
- [ ] Tax Rates & Multi-currency

### Procurement & Supply Chain
- [ ] Vendors (CRUD, status, capabilities, documents, scoring)
- [ ] Vendor Contracts
- [ ] Purchase Orders (create, status, receipts)
- [ ] Goods Receipts
- [ ] Sourcing (RFQ, quotes, rounds, awards)
- [ ] Reorder Candidates & Auto-reorder
- [ ] Procurement Meta (categories, statuses)
- [ ] Procurement Spend Reports
- [ ] Supplier Performance Reports

### Assets & Inventory
- [ ] Assets (lifecycle, deployment, maintenance, disposal)
- [ ] Asset Categories
- [ ] Asset Maintenance Records
- [ ] Inventory/Stock Tracking
- [ ] Stock Adjustments & Transfers

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

## App Status
- **Running at:** http://localhost:3000
- **Build:** ✅ Pass
- **Lint:** ✅ Pass
- **Total Modules:** 12 complete + PWA + Global Search
- **Total API Endpoints:** 50+
- **Total Pages:** 15+