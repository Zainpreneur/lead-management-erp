'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { CashAccount, CashTransaction } from '@/lib/types';
import { CASH_ACCOUNT_TYPE_LABELS, CASH_TRANSACTION_TYPE_LABELS } from '@/lib/types';

export default function CashPage() {
  const toast = useToast();
  const [accounts, setAccounts] = React.useState<CashAccount[]>([]);
  const [transactions, setTransactions] = React.useState<CashTransaction[]>([]);
  const [selectedAccount, setSelectedAccount] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [creatingAccount, setCreatingAccount] = React.useState(false);
  const [creatingTxn, setCreatingTxn] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [accountForm, setAccountForm] = React.useState({ name: '', type: 'bank', currency: 'USD', balance: 0, accountNumber: '', bankName: '' });
  const [txnForm, setTxnForm] = React.useState({ accountReference: '', type: 'deposit', amount: 0, description: '', transactionDate: new Date().toISOString().slice(0, 10) });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [accs, txns] = await Promise.all([
        api.listCashAccounts(),
        api.listCashTransactions({ accountReference: selectedAccount || undefined }),
      ]);
      setAccounts(accs.accounts);
      setTransactions(txns.transactions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedAccount]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCashAccount(accountForm);
      setCreatingAccount(false);
      toast.add({ variant: 'success', title: 'Account created' });
      setAccountForm({ name: '', type: 'bank', currency: 'USD', balance: 0, accountNumber: '', bankName: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create account', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleCreateTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCashTransaction(txnForm);
      setCreatingTxn(false);
      toast.add({ variant: 'success', title: 'Transaction recorded' });
      setTxnForm({ accountReference: '', type: 'deposit', amount: 0, description: '', transactionDate: new Date().toISOString().slice(0, 10) });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not record transaction', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleReconcile = async (ref: string) => {
    try {
      await api.reconcileTransaction(ref);
      toast.add({ variant: 'success', title: 'Transaction reconciled' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not reconcile', description: e instanceof Error ? e.message : '' });
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const accountOptions: import("@/components/ui/Combobox").ComboboxOption<CashAccount>[] = accounts.map((a) => ({
    value: a.reference,
    label: a.name,
    subtitle: [a.type, a.currency, a.balance.toLocaleString(), a.reference].filter(Boolean).join(' · '),
    badge: a.type,
    badgeVariant: "secondary" as const,
    avatar: a.name.charAt(0).toUpperCase(),
    meta: a,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Cash & Bank</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{accounts.length} accounts</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setCreatingTxn(true)}>+ Transaction</Button>
            <Button size="sm" onClick={() => setCreatingAccount(true)}>+ Account</Button>
          </div>
        </div>
      </div>

      {/* Total balance card */}
      <div className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Balance</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">${totalBalance.toLocaleString()}</div>
      </div>

      {/* Accounts */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Accounts</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className={`rounded-md border border-slate-200 bg-white p-4 cursor-pointer ${selectedAccount === acc.reference ? 'ring-2 ring-brand-500' : ''}`} onClick={() => setSelectedAccount(acc.reference === selectedAccount ? '' : acc.reference)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{acc.name}</div>
                    <div className="text-xs text-slate-500">{CASH_ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type} • {acc.currency} • {acc.bankName || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${acc.balance.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{acc.accountNumber || '—'}</div>
                  </div>
                </div>
              </div>
            ))}
            {accounts.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No accounts.</div>}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Transactions {selectedAccount ? `(${selectedAccount})` : ''}
        </h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{t.description || t.type}</div>
                    <div className="text-xs text-slate-500">{t.reference} • {t.accountReference} • {new Date(t.transactionDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-bold ${t.type === 'withdrawal' || t.type === 'payment' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {t.type === 'withdrawal' || t.type === 'payment' ? '-' : '+'}${t.amount.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      {!t.reconciled && (
                        <button onClick={() => handleReconcile(t.reference)} className="text-xs text-brand-600 hover:underline">Reconcile</button>
                      )}
                      {t.reconciled && <span className="text-xs text-emerald-600">✓ Reconciled</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No transactions.</div>}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      <Modal open={creatingAccount} onClose={() => setCreatingAccount(false)} title="New Cash Account">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(CASH_ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <Input value={accountForm.currency} onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Initial Balance</label>
              <Input type="number" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bank Name</label>
              <Input value={accountForm.bankName} onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Account Number</label>
            <Input value={accountForm.accountNumber} onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreatingAccount(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Create Transaction Modal */}
      <Modal open={creatingTxn} onClose={() => setCreatingTxn(false)} title="Record Transaction">
        <form onSubmit={handleCreateTxn} className="space-y-4">
          <div>
            <Combobox
              label="Account"
              required
              options={accountOptions}
              value={txnForm.accountReference}
              onChange={(v) => setTxnForm({ ...txnForm, accountReference: v })}
              placeholder="Search account by name, type, balance..."
              recentKey="cash-txn-account"
              allowCreate={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(CASH_TRANSACTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
              <Input type="number" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <Input type="date" value={txnForm.transactionDate} onChange={(e) => setTxnForm({ ...txnForm, transactionDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Textarea value={txnForm.description} onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreatingTxn(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Record'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
