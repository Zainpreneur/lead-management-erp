import type { ComboboxOption } from '@/components/ui/Combobox';
import type { Invoice } from '@/lib/types';
import type { Customer, Vendor, Product, Person, Employee, Project, PurchaseOrder, SourcingRequest, Asset, Lead } from '@/lib/types';

// Customer
export function customerToOption(c: Customer): ComboboxOption<Customer> {
  return {
    value: c.reference,
    label: c.name,
    subtitle: [
      c.contactPhone,
      c.contactEmail,
      c.city && c.country ? `${c.city}, ${c.country}` : c.city || c.country,
      c.reference,
    ].filter(Boolean).join(' · '),
    badge: c.status,
    badgeVariant: c.status === 'active' ? 'success' : c.status === 'inactive' ? 'secondary' : 'warning',
    avatar: c.name.charAt(0).toUpperCase(),
    meta: c,
  };
}

// Vendor
export function vendorToOption(v: Vendor): ComboboxOption<Vendor> {
  return {
    value: v.reference,
    label: v.name,
    subtitle: [
      v.contactPhone,
      v.contactEmail,
      v.city && v.country ? `${v.city}, ${v.country}` : v.city || v.country,
      v.kind,
      v.reference,
    ].filter(Boolean).join(' · '),
    badge: v.status,
    badgeVariant: v.status === 'active' ? 'success' : v.status === 'inactive' ? 'secondary' : 'warning',
    avatar: v.name.charAt(0).toUpperCase(),
    meta: v,
  };
}

// Product
export function productToOption(p: Product): ComboboxOption<Product> {
  return {
    value: p.reference,
    label: p.name,
    subtitle: [
      p.sku,
      p.type,
      `$${p.price.toLocaleString()}`,
      p.reference,
    ].filter(Boolean).join(' · '),
    badge: p.status,
    badgeVariant: p.status === 'active' ? 'success' : 'secondary',
    avatar: p.name.charAt(0).toUpperCase(),
    meta: p,
  };
}

// Person (for assignees)
export function personToOption(p: Person): ComboboxOption<Person> {
  return {
    value: String(p.id),
    label: p.name,
    subtitle: [p.email, p.phone, p.team, p.role].filter(Boolean).join(' · '),
    badge: p.role,
    avatar: p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    meta: p,
  };
}

// Employee
export function employeeToOption(e: Employee): ComboboxOption<Employee> {
  const fullName = `${e.firstName} ${e.lastName}`.trim();
  return {
    value: e.reference,
    label: fullName,
    subtitle: [e.email, e.department, e.position, e.reference].filter(Boolean).join(' · '),
    badge: e.status,
    badgeVariant: e.status === 'active' ? 'success' : 'secondary',
    avatar: fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    meta: e,
  };
}

// Lead
export function leadToOption(l: Lead): ComboboxOption<Lead> {
  return {
    value: l.reference,
    label: l.name,
    subtitle: [l.contactEmail, l.contactPhone, l.city, l.reference].filter(Boolean).join(' · '),
    badge: l.stage,
    badgeVariant: l.stage === 'won' ? 'success' : l.stage === 'lost' ? 'destructive' : 'warning',
    avatar: l.name.charAt(0).toUpperCase(),
    meta: l,
  };
}

// Project
export function projectToOption(p: Project): ComboboxOption<Project> {
  return {
    value: p.reference,
    label: p.name,
    subtitle: [p.managerName, p.status, p.reference].filter(Boolean).join(' · '),
    badge: p.status,
    badgeVariant: p.status === 'active' ? 'success' : p.status === 'completed' ? 'secondary' : 'warning',
    avatar: p.name.charAt(0).toUpperCase(),
    meta: p,
  };
}

// Purchase Order
export function poToOption(po: PurchaseOrder): ComboboxOption<PurchaseOrder> {
  return {
    value: po.reference,
    label: po.reference,
    subtitle: [po.vendorName, `$${po.totalAmount.toLocaleString()}`, po.status, po.reference].filter(Boolean).join(' · '),
    badge: po.status,
    badgeVariant: po.status === 'approved' || po.status === 'ordered' ? 'success' : po.status === 'received' ? 'secondary' : 'warning',
    avatar: 'PO',
    meta: po,
  };
}

// Sourcing Request
export function sourcingToOption(s: SourcingRequest): ComboboxOption<SourcingRequest> {
  return {
    value: s.reference,
    label: s.title,
    subtitle: [s.reference, `Round ${s.round}`, s.status, `${s.lines.length} lines`].filter(Boolean).join(' · '),
    badge: s.status,
    badgeVariant: s.status === 'published' ? 'success' : s.status === 'awarded' ? 'secondary' : 'warning',
    avatar: 'SR',
    meta: s,
  };
}

// Asset
export function assetToOption(a: Asset): ComboboxOption<Asset> {
  return {
    value: a.reference,
    label: a.name,
    subtitle: [a.categoryName, a.status, a.assignedToName, a.reference].filter(Boolean).join(' · '),
    badge: a.status,
    badgeVariant: a.status === 'deployed' ? 'success' : a.status === 'acquired' ? 'warning' : 'secondary',
    avatar: a.name.charAt(0).toUpperCase(),
    meta: a,
  };
}

// Invoice
export function invoiceToOption(inv: Invoice): ComboboxOption<Invoice> {
  return {
    value: inv.reference,
    label: inv.reference,
    subtitle: [inv.customerName, `${inv.currency} ${inv.totalAmount.toLocaleString()}`, inv.status, inv.reference].filter(Boolean).join(' · '),
    badge: inv.status,
    badgeVariant: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'destructive' : 'warning',
    avatar: 'INV',
    meta: inv,
  };
}

// Generic helper for any array
export function toComboboxOptions<T>(
  items: T[],
  mapper: (item: T) => ComboboxOption<T>
): ComboboxOption<T>[] {
  return items.map(mapper);
}
