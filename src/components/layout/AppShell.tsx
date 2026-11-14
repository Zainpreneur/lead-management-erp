'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, FileText, CreditCard, FileSignature, CheckSquare, Package, Contact, ScrollText, Receipt, ClipboardList, Ticket, Search, Wallet, DollarSign, BarChart3, File, Truck, ShoppingCart, Warehouse, ShieldCheck, Briefcase, FolderKanban, Zap, Settings, Wifi, Tag, Box, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/customers', label: 'Customers', icon: Building2 },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/proposals', label: 'Proposals', icon: FileSignature },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/cash', label: 'Cash & Bank', icon: Wallet },
  { href: '/tax-rates', label: 'Tax Rates', icon: Receipt },
  { href: '/currencies', label: 'Currencies', icon: DollarSign },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/vendors', label: 'Vendors', icon: Truck },
  { href: '/sourcing', label: 'Sourcing', icon: ShoppingCart },
  { href: '/vendor-contracts', label: 'Vendor Contracts', icon: File },
  { href: '/vendor-payouts', label: 'Vendor Payouts', icon: DollarSign },
  { href: '/vendor-invoices', label: 'Vendor Invoices', icon: FileText },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/stock-transfers', label: 'Stock Transfers', icon: Truck },
  { href: '/reorder-candidates', label: 'Reorder Candidates', icon: Package },
  { href: '/goods-receipts', label: 'Goods Receipts', icon: Truck },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/assets', label: 'Assets', icon: Box },
  { href: '/quality', label: 'Quality', icon: ShieldCheck },
  { href: '/employees', label: 'Employees', icon: Briefcase },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/resource-planning', label: 'Resource Planning', icon: Users },
  { href: '/contacts', label: 'Contacts', icon: Contact },
  { href: '/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/automation', label: 'Automation', icon: Zap },
  { href: '/platform', label: 'Platform', icon: Settings },
  { href: '/offline', label: 'Offline Sync', icon: Wifi },
  { href: '/documents', label: 'Documents', icon: File },
  { href: '/requests', label: 'Requests', icon: ClipboardList },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const saved = window.localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    window.localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-slate-900">Lead Management</span>
        <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))} aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100">
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 scrollbar-thin overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed && <span className="font-semibold text-slate-900">Lead Mgmt</span>}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
            className="hidden h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 md:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>


        <nav className="flex-1 space-y-1 px-2 py-2">
          {links.map((l) => {
            const Icon = l.icon;
            const active = l.href === '/' ? pathname === '/' : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{l.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className={`flex-1 pt-14 transition-all duration-200 md:pt-0 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {children}
      </main>
    </div>
  );
}