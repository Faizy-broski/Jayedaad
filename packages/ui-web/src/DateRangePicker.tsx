import { useState } from 'react';
import { cn } from './lib/cn';

export interface DateRange {
  from?: string; // ISO date (YYYY-MM-DD)
  to?: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 15 Days', days: 15 },
  { label: 'Last 30 Days', days: 30 },
];

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatLabel(range: DateRange): string {
  if (!range.from && !range.to) return 'Select date range';
  if (range.from === range.to) return range.from!;
  return `${range.from ?? '…'} - ${range.to ?? '…'}`;
}

// Quick-preset list + single-month calendar grid, matching the Profolio
// "Listed Date" filter reference — not a general-purpose date library,
// scoped to exactly what the reference shows (presets + click-to-select
// start/end + Confirm/Cancel).
export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value.from ? new Date(value.from) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  function openPanel() {
    setDraft(value);
    setOpen(true);
  }

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDraft({ from: toIso(from), to: toIso(to) });
  }

  function pickDay(day: Date) {
    const iso = toIso(day);
    if (!draft.from || (draft.from && draft.to)) {
      setDraft({ from: iso, to: undefined });
    } else if (iso < draft.from) {
      setDraft({ from: iso, to: draft.from });
    } else {
      setDraft({ from: draft.from, to: iso });
    }
  }

  function confirm() {
    onChange(draft);
    setOpen(false);
  }

  function cancel() {
    setDraft(value);
    setOpen(false);
  }

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = viewMonth.getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={openPanel}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span aria-hidden className="shrink-0 text-muted-foreground">
          📅
        </span>
        <span className="truncate">{formatLabel(value)}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex w-[420px] rounded-md border border-border bg-background shadow-lg">
          <div className="flex w-32 shrink-0 flex-col border-r border-border py-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className="px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="rounded p-1 hover:bg-muted"
              >
                ‹
              </button>
              <span className="text-sm font-medium">
                {viewMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="rounded p-1 hover:bg-muted"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <span key={i} />;
                const iso = toIso(day);
                const inRange = draft.from && draft.to && iso >= draft.from && iso <= draft.to;
                const isEdge = iso === draft.from || iso === draft.to;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={cn(
                      'rounded p-1.5 text-sm hover:bg-muted',
                      inRange && 'bg-primary/10',
                      isEdge && 'bg-primary text-primary-foreground hover:bg-primary',
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                {draft.from ?? '…'} - {draft.to ?? '…'}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={cancel} className="rounded-md border border-input px-3 py-1.5 text-xs">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
