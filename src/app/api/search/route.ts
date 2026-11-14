import { NextResponse } from 'next/server';
import { listLeads } from '@/lib/server/leads';
import { listCustomers } from '@/lib/server/customers';
import { listInvoices } from '@/lib/server/invoices';
import { listProducts } from '@/lib/server/products';
import { listTasks } from '@/lib/server/tasks';
import { listExpenses } from '@/lib/server/expenses';
import { listProposals } from '@/lib/server/proposals';
import { listRequests } from '@/lib/server/serviceRequests';
import { listTickets } from '@/lib/server/tickets';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const q = `%${query}%`;
  const results: Array<{ type: string; reference: string; title: string; subtitle?: string; url: string }> = [];

  try {
    // Search leads
    const leads = listLeads({ search: query, limit: 5 });
    for (const lead of leads) {
      results.push({ type: 'lead', reference: lead.reference, title: lead.name, subtitle: `${lead.stage} • ${lead.city || ''}`, url: `/leads/${lead.reference}` });
    }

    // Search customers
    const customers = listCustomers({ search: query, limit: 5 });
    for (const customer of customers) {
      results.push({ type: 'customer', reference: customer.reference, title: customer.name, subtitle: `${customer.status} • ${customer.city || ''}`, url: `/customers/${customer.reference}` });
    }

    // Search invoices
    const invoices = listInvoices({ search: query, limit: 5 });
    for (const invoice of invoices) {
      results.push({ type: 'invoice', reference: invoice.reference, title: `${invoice.reference} - ${invoice.customerName}`, subtitle: `${invoice.status} • $${invoice.totalAmount}`, url: `/invoices/${invoice.reference}` });
    }

    // Search products
    const products = listProducts({ search: query, limit: 5 });
    for (const product of products) {
      results.push({ type: 'product', reference: product.reference, title: product.name, subtitle: `$${product.price} • ${product.type}`, url: `/products` });
    }

    // Search tasks
    const tasks = listTasks({ search: query, limit: 5 });
    for (const task of tasks) {
      results.push({ type: 'task', reference: task.reference, title: task.title, subtitle: `${task.status} • ${task.priority}`, url: `/tasks` });
    }

    // Search expenses
    const expenses = listExpenses({ search: query, limit: 5 });
    for (const expense of expenses) {
      results.push({ type: 'expense', reference: expense.reference, title: expense.title, subtitle: `${expense.status} • $${expense.amount}`, url: `/expenses` });
    }

    // Search proposals
    const proposals = listProposals({ search: query, limit: 5 });
    for (const proposal of proposals) {
      results.push({ type: 'proposal', reference: proposal.reference, title: proposal.title, subtitle: `${proposal.status} • $${proposal.total}`, url: `/proposals` });
    }

    // Search requests
    const requests = listRequests({ search: query, limit: 5 });
    for (const request of requests) {
      results.push({ type: 'request', reference: request.reference, title: request.title, subtitle: `${request.status} • ${request.priority}`, url: `/requests` });
    }

    // Search tickets
    const tickets = listTickets({ search: query, limit: 5 });
    for (const ticket of tickets) {
      results.push({ type: 'ticket', reference: ticket.reference, title: ticket.subject, subtitle: `${ticket.status} • ${ticket.priority}`, url: `/tickets` });
    }
  } catch (err) {
    console.error('Search error:', err);
  }

  return NextResponse.json({ results });
}