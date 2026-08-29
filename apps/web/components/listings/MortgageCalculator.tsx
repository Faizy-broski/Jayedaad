'use client';

import { useMemo, useState } from 'react';

interface MortgageCalculatorProps {
  priceValue: number;
}

function formatPkr(value: number): string {
  return `PKR ${Math.round(value).toLocaleString('en-PK')}`;
}

export function MortgageCalculator({ priceValue }: MortgageCalculatorProps) {
  const [downPayment, setDownPayment] = useState(Math.round(priceValue * 0.2));
  const [loanAmount, setLoanAmount] = useState(priceValue - Math.round(priceValue * 0.2));
  const [interestRate, setInterestRate] = useState(14);
  const [years, setYears] = useState(20);

  const monthlyPayment = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return loanAmount / numPayments;
    return (loanAmount * monthlyRate * (1 + monthlyRate) ** numPayments) / ((1 + monthlyRate) ** numPayments - 1);
  }, [loanAmount, interestRate, years]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Loan Amount (PKR)</span>
          <input
            type="number"
            min={0}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Down Payment (PKR)</span>
          <input
            type="number"
            min={0}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Interest Rate (%)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Years</span>
          <input
            type="number"
            min={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      <div className="flex w-full shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-heading-gradient px-2 py-3 text-center text-primary-foreground sm:w-40 sm:px-5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">Monthly Payment</span>
        <span className="text-sm font-bold leading-tight sm:text-lg">{formatPkr(monthlyPayment)}</span>
        <span className="text-[10px] text-white/70">Est. over {years} years</span>
      </div>
    </div>
  );
}
