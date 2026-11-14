'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerForm } from '@/components/lead/CustomerForm';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import type { CustomerInput, Person } from '@/lib/types';

export default function NewCustomerPage() {
  const router = useRouter();
  const toast = useToast();
  const [people, setPeople] = React.useState<Person[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    api.people().then((p) => setPeople(p.people)).catch(console.error);
  }, []);

  const handleSubmit = async (input: CustomerInput) => {
    setSubmitting(true);
    try {
      const { customer } = await api.createCustomer(input);
      toast.add({ variant: 'success', title: 'Customer created' });
      router.push(`/customers/${customer.reference}`);
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create customer', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHeader title="New Customer" description="Create a new customer" />
      <CustomerForm people={people} submitting={submitting} onSubmit={handleSubmit} />
    </div>
  );
}