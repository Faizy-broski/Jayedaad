import { CalendarRange, PercentCircle, Repeat } from 'lucide-react';
import type { ProjectPaymentPlan } from '@/lib/types';

interface ProjectPaymentPlansProps {
  plans: ProjectPaymentPlan[];
}

export function ProjectPaymentPlans({ plans }: ProjectPaymentPlansProps) {
  if (plans.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
        No payment plans available yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {plans.map((plan) => (
        <div key={plan.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">{plan.label}</p>
          <p className="text-xs text-slate-600">{plan.description}</p>

          <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <PercentCircle className="h-3.5 w-3.5" />
              {plan.bookingPercent}% booking
            </span>
            {plan.installmentCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                {plan.installmentCount} {plan.installmentFrequency.toLowerCase()} installments
              </span>
            )}
            {plan.balloonPaymentCount > 0 && (
              <span className="flex items-center gap-1.5">
                <CalendarRange className="h-3.5 w-3.5" />
                {plan.balloonPaymentCount} balloon payment{plan.balloonPaymentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
