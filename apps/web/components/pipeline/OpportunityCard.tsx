'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Opportunity, useFormattedPrice } from '@jayedaad/core';
import { Calendar } from 'lucide-react';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function OpportunityCard({ opportunity, onOpen }: { opportunity: Opportunity; onOpen: (opportunity: Opportunity) => void }) {
  const { format: formatPrice } = useFormattedPrice();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opportunity.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(opportunity)}
      className={`cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <p className="truncate text-sm font-semibold text-foreground">{opportunity.name}</p>
      <p className="mt-1 text-sm font-bold text-primary">{formatPrice(opportunity.value)}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(opportunity.expectedCloseDate)}
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium">{opportunity.probability}%</span>
      </div>
    </div>
  );
}
