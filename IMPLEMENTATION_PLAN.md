# ERP Implementation Plan — lead-management-next

## Overview
Detailed implementation plan to transform `lead-management-next` from a functional CRM/ERP into a production-grade, enterprise-ready system. Organized into 8 sprints over 16 weeks.

---

## Sprint 1: Foundation & Security (Weeks 1-2)

### 1.1 RBAC Enforcement
- [ ] Add permission checks to all 90+ API routes
- [ ] Create permission middleware helper
- [ ] Add role-based UI (hide/show actions based on role)
- [ ] Add permission seed data (admin, manager, user, viewer)
- [ ] Test permission matrix for all modules

### 1.2 Audit Log Coverage
- [ ] Add audit logging to all remaining CRUD operations
- [ ] Add user tracking (who performed action)
- [ ] Add before/after state capture
- [ ] Add audit log retention policy
- [ ] Add audit log export (CSV)

### 1.3 Data Integrity
- [ ] Add soft deletes (`deleted_at` column to all tables)
- [ ] Add optimistic locking (`version` column to all tables)
- [ ] Add CHECK constraints on all status fields
- [ ] Add UNIQUE constraints where missing
- [ ] Add NOT NULL constraints where appropriate

### 1.4 Database Indexes
- [ ] Add indexes on all foreign keys
- [ ] Add indexes on search columns (name, reference, city, etc.)
- [ ] Add composite indexes for common query patterns
- [ ] Add full-text search (SQLite FTS5) for global search

### 1.5 Input Validation
- [ ] Add Zod validation to all API routes (currently only some have it)
- [ ] Add request body size limits
- [ ] Add rate limiting middleware
- [ ] Add CSRF protection

### 1.6 Error Handling
- [ ] Standardize error responses across all routes
- [ ] Add global error boundary in frontend
- [ ] Add retry logic for failed requests
- [ ] Add offline error handling

---

## Sprint 2: Financials (Weeks 3-4)

### 2.1 Invoice Enhancements
- [ ] PDF generation (using react-pdf or puppeteer)
- [ ] Payment schedules (deposits, milestones)
- [ ] Refunds and credit notes
- [ ] Invoice templates
- [ ] Recurring invoices
- [ ] Invoice approval workflow
- [ ] Dunning (automated payment reminders)
- [ ] Multi-currency with exchange rates
- [ ] Tax calculation (VAT, GST, sales tax)

### 2.2 Expense Approvals
- [ ] Multi-level approval workflow
- [ ] Approval chain configuration
- [ ] Approval notifications
- [ ] Rejection with reason
- [ ] Expense policy enforcement
- [ ] Expense reimbursement tracking

### 2.3 Bank/Cash Management
- [ ] Bank statement import (CSV/OFX)
- [ ] Transaction matching
- [ ] Reconciliation reports
- [ ] Cash flow forecasting
- [ ] Multi-account transfers
- [ ] Bank fee tracking

### 2.4 Financial Reports
- [ ] P&L statement UI
- [ ] Cash flow statement UI
- [ ] Aging reports (AR/AP)
- [ ] Revenue by customer report
- [ ] Expense by category report
- [ ] Profitability analysis
- [ ] Export reports to PDF/Excel

---

## Sprint 3: Operations (Weeks 5-6)

### 3.1 Document Management
- [ ] File upload (multipart/form-data)
- [ ] File storage (local/S3)
- [ ] File preview (PDF, images)
- [ ] Version control
- [ ] Document sharing
- [ ] Document categories
- [ ] Document search (full-text)
- [ ] Document expiry notifications

### 3.2 Inventory Management
- [ ] Stock level tracking
- [ ] Reorder alerts
- [ ] Stock adjustments
- [ ] Stock transfers between locations
- [ ] Inventory valuation (FIFO, LIFO, weighted average)
- [ ] Low stock dashboard
- [ ] Inventory reports

### 3.3 Purchase Order Workflow
- [ ] PO approval workflow
- [ ] Goods receipt
- [ ] PO → Invoice conversion
- [ ] Vendor performance tracking
- [ ] PO status tracking
- [ ] PO amendments
- [ ] PO cancellation

### 3.4 Quality Management
- [ ] Inspection templates
- [ ] CAPA (Corrective and Preventive Action) workflow
- [ ] Quality metrics dashboard
- [ ] Supplier quality tracking
- [ ] Quality standards compliance
- [ ] Quality reports

---

## Sprint 4: People & Planning (Weeks 7-8)

### 4.1 Workforce/HR
- [ ] Leave management (request, approve, track)
- [ ] Performance reviews
- [ ] Training records
- [ ] Org chart
- [ ] Onboarding/offboarding
- [ ] Employee self-service portal
- [ ] Time-off calendar

### 4.2 Payroll Integration
- [ ] Payroll calculation (tax, deductions, benefits)
- [ ] Payroll export to accounting
- [ ] Pay slip generation
- [ ] Payroll reports
- [ ] Tax compliance (W-2, 1099, etc.)

### 4.3 Project Management
- [ ] Milestones (CRUD, status tracking)
- [ ] Time tracking integration
- [ ] Project budget vs actual
- [ ] Project templates
- [ ] Project analytics
- [ ] Resource allocation per project
- [ ] Project billing (milestone-based invoicing)

### 4.4 Resource Planning
- [ ] Capacity planning
- [ ] Utilization reports
- [ ] Resource allocation dashboard
- [ ] Skill matrix
- [ ] Availability calendar
- [ ] Resource forecasting

---

## Sprint 5: Analytics & Automation (Weeks 9-10)

### 5.1 Dashboard Enhancement
- [ ] Revenue charts (line, bar, pie)
- [ ] Pipeline funnel visualization
- [ ] Conversion rate tracking
- [ ] Activity timeline
- [ ] Upcoming tasks/deadlines
- [ ] Notifications center
- [ ] Customizable widgets
- [ ] KPI cards with trend indicators
- [ ] Drill-down capabilities
- [ ] Dashboard templates
- [ ] Dashboard sharing
- [ ] Dashboard export (PDF)

### 5.2 Workflow Automation
- [ ] Trigger engine (event-based)
- [ ] Condition evaluation (if/then/else)
- [ ] Action execution (create task, send email, update status)
- [ ] Workflow templates
- [ ] Workflow logging
- [ ] Workflow testing

### 5.3 Email/SMS Integration
- [ ] Email provider integration (SendGrid, SES, etc.)
- [ ] SMS provider integration (Twilio, etc.)
- [ ] Email template rendering
- [ ] Email tracking (opens, clicks)
- [ ] Email scheduling
- [ ] Email queue management
- [ ] Email analytics

### 5.4 Scheduled Reports
- [ ] Cron-based scheduling
- [ ] Report generation
- [ ] Email delivery
- [ ] Report history
- [ ] Report templates
- [ ] Report sharing

---

## Sprint 6: Platform (Weeks 11-12)

### 6.1 Offline Support
- [ ] IndexedDB setup (Dexie.js)
- [ ] Offline data sync
- [ ] Offline mutation queue
- [ ] Background sync
- [ ] Conflict resolution
- [ ] Offline indicator
- [ ] Data caching strategy

### 6.2 Import/Export (CSV, Excel)
- [ ] CSV import (leads, customers, products)
- [ ] Excel import (XLSX parsing)
- [ ] CSV export (all modules)
- [ ] Excel export (all modules)
- [ ] Data validation on import
- [ ] Import preview
- [ ] Import history
- [ ] Export templates
- [ ] CSV import (leads, customers, products)
- [ ] Excel import (XLSX parsing)
- [ ] CSV export (all modules)
- [ ] Excel export (all modules)
- [ ] Data validation on import
- [ ] Import preview
- [ ] Import history
- [ ] Export templates

### 6.4 Real-time Updates
- [ ] WebSocket server (Socket.io or native)
- [ ] Real-time notifications
- [ ] Live data updates
- [ ] Presence indicators
- [ ] Collaborative editing

---

## Sprint 7: Advanced Features (Weeks 13-14)

### 7.1 Lead Management
- [ ] Lead duplicate detection (fuzzy matching)
- [ ] Lead nurturing sequences
- [ ] Lead source tracking with UTM
- [ ] Lead assignment rules
- [ ] Lead scoring automation
- [ ] Lead import/export
- [ ] Lead merge/dedup
- [ ] Custom fields support
- [ ] Lead timeline view

### 7.2 Customer Management
- [ ] Customer health score calculation
- [ ] Customer tier auto-upgrade
- [ ] Customer segmentation
- [ ] Customer lifetime value tracking
- [ ] Customer portal (self-service)
- [ ] Customer tags and custom fields
- [ ] Customer merge/dedup
- [ ] Customer import/export

### 7.3 Invoice Management
- [ ] Billing runs (batch generation)
- [ ] Consolidated invoices
- [ ] Invoice templates
- [ ] Recurring invoices
- [ ] Invoice approval workflow
- [ ] Dunning (automated reminders)
- [ ] Invoice aging report
- [ ] Multi-currency with exchange rates

### 7.4 Payment Management
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Partial payment tracking
- [ ] Payment reconciliation
- [ ] Refund processing
- [ ] Payment method management
- [ ] Payment receipts
- [ ] Payment history per customer
- [ ] Payment dashboard (cash flow)

---

## Sprint 8: Polish & Production (Weeks 15-16)

### 8.1 Testing
- [ ] Unit tests for domain logic
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] Performance tests
- [ ] Security tests

### 8.2 Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide
- [ ] Developer guide
- [ ] Deployment guide
- [ ] Architecture documentation

### 8.3 Performance
- [ ] Database query optimization
- [ ] Add caching layer (Redis)
- [ ] Add connection pooling
- [ ] Add lazy loading
- [ ] Add code splitting
- [ ] Add bundle optimization

### 8.4 Security
- [ ] Security audit
- [ ] Penetration testing
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Data encryption at rest
- [ ] HTTPS enforcement

---

## Migration Strategy

### From zainpreneur-v2
1. Keep zainpreneur-v2 running as reference
2. Migrate one module at a time
3. Reuse domain logic (pure rules)
4. Add integration tests before cutover
5. Use feature flags to switch traffic
6. Gradual rollout with rollback capability

### Database Migration
1. Export data from zainpreneur-v2 SQLite
2. Transform data to new schema
3. Import into lead-management-next
4. Verify data integrity
5. Switch traffic

---

## Success Criteria
- [ ] All 28 modules functional in Next.js
- [ ] All 90+ API endpoints working
- [ ] 35+ pages responsive on mobile/tablet/desktop
- [ ] Build + lint green for every module
- [ ] Demo data seeded for all modules
- [ ] Auth + RBAC enforced on all routes
- [ ] All mutations audited
- [ ] Full-text search across modules
- [ ] Offline-first with sync
- [ ] Import/export in multiple formats
- [ ] 80%+ test coverage
- [ ] API documentation complete
- [ ] Production deployment ready

---

## Current Status
- **Modules:** 28 complete
- **API Endpoints:** 90+
- **Pages:** 35+
- **Components:** 22
- **Database Tables:** 40+
- **Build:** ✅ Pass
- **Lint:** ✅ 0 errors
- **App Running:** http://localhost:3000

## App Status
- **Running at:** http://localhost:3000
- **Build:** ✅ Pass
- **Lint:** ✅ Pass (0 errors, 59 warnings)
- **Total Modules:** 28 complete
- **Total API Endpoints:** 90+
- **Total Pages:** 35+