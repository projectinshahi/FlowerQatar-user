"use client";

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatValidity } from '@/lib/validations/subscription-plan';
import EditPlanModal, { type AdminPlan } from './EditPlanModal';

export default function SubscriptionPlansManager() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<AdminPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/subscription-plans');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlans(data.plans);
    } catch {
      toast.error('Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans();
  }, [fetchPlans]);

  const onSaved = () => {
    setEditing(null);
    fetchPlans();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-24 rounded skeleton" />
            <div className="mb-4 h-10 w-20 rounded skeleton" />
            <div className="mt-6 h-9 w-full rounded-lg skeleton" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Responsive: 1 / 2 / 3 columns; equal heights via grid stretch. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Tier accent bar */}
            <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: plan.accent }} aria-hidden="true" />

            <h2 className="font-serif text-xl font-bold" style={{ color: plan.accent }}>{plan.name}</h2>

            {/* The single feature-points number, shown prominently */}
            <div className="mt-4 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Feature Points</p>
              <p className="font-serif text-4xl font-light text-gray-900">{plan.featurePoints.toLocaleString()}</p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                QAR {plan.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                <Clock size={12} />
                {formatValidity(plan.validityYears, plan.validityMonths, plan.validityDays) || 'No validity'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                <Package size={12} />
                {plan.productIds.length} {plan.productIds.length === 1 ? 'product' : 'products'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEditing(plan)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#A83A22] px-4 py-2.5 font-medium text-white transition hover:bg-[#8e311d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A83A22] focus-visible:ring-offset-2"
            >
              <Pencil size={16} /> Edit
            </button>
          </article>
        ))}
      </div>

      {editing && <EditPlanModal plan={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </>
  );
}
