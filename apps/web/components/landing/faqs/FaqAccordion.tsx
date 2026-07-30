'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import type { FAQ } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  // First item open by default, matching the reference screenshot.
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="divide-y divide-slate-200 border-t border-slate-200">
      {faqs.map((faq, index) => {
        const isOpen = openId === faq.id;

        return (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: EASE, delay: index * 0.05 }}
          >
            <button
              type="button"
              onClick={() => toggle(faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-base font-semibold text-slate-900">{faq.question}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors">
                {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </span>
            </button>

            {/* Grid-rows trick for a smooth height animation without a fixed
                max-height guess — 0fr collapses fully, 1fr expands to fit
                content, and the inner div's overflow-hidden clips it mid-transition. */}
            <div
              className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-5 text-sm leading-relaxed text-slate-500">{faq.answer}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}