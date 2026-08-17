'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AgentCreditType } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';
import { ChevronDown, Clapperboard, Flame, RefreshCw, Sparkles, Zap } from 'lucide-react';

// Consolidates the Hot/Super Hot/Refresh/Story credit-spend actions into
// one dropdown — with each as its own button and a "(N)" credit count
// appended, they routinely wrapped the action row onto 2-3 lines. Fully
// generic (no listing/project-specific logic) so both
// property-management/page.tsx (listings) and ProjectsListView.tsx
// (projects) share this one implementation — they spend from the SAME
// agent_credits pool, so duplicating this component would just be two
// copies of the same portal/positioning logic (including its
// stacking-context workaround, see the position:fixed comment below) to
// keep in sync forever.
//
// Portaled to document.body with position:fixed coordinates (from the
// trigger's own getBoundingClientRect) rather than position:absolute
// inside this component's own div — any ancestor row with a CSS transform
// (e.g. a Framer Motion whileHover) creates a new stacking context that
// traps an absolutely-positioned dropdown inside that row's own local
// z-order, unable to paint above a later sibling row no matter its
// z-index. This sidesteps that entirely.
export function CreditsMenu({
  creditsAvailable,
  isPending,
  onHot,
  onSuperHot,
  onRefresh,
  onStory,
}: {
  creditsAvailable: (type: AgentCreditType) => number;
  isPending: boolean;
  onHot: () => void;
  onSuperHot: () => void;
  onRefresh: () => void;
  onStory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function updateRect() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.right - 224, width: 224 });
    }
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  const items: { key: AgentCreditType; label: string; icon: typeof Sparkles; onClick: () => void; title: string }[] = [
    { key: 'hot', label: 'Hot', icon: Sparkles, onClick: onHot, title: 'Spend a Hot credit to feature this' },
    {
      key: 'super_hot',
      label: 'Super Hot',
      icon: Flame,
      onClick: onSuperHot,
      title: 'Spend a Super Hot credit to feature this',
    },
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      onClick: onRefresh,
      title: 'Spend a Refresh credit to bump this back to the top',
    },
    {
      key: 'story',
      label: 'Story',
      icon: Clapperboard,
      onClick: onStory,
      title: 'Spend a Story credit to feature this for 24 hours',
    },
  ];

  return (
    <>
      <Button ref={triggerRef} variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <Zap className="mr-1.5 h-3.5 w-3.5" />
        Boost credits
        <ChevronDown className={`ml-1.5 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
            className={`z-50 origin-top-right rounded-md border border-border bg-background p-1 shadow-lg transition-all duration-150 ease-out ${
              open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0'
            }`}
          >
            {items.map((item) => {
              const available = creditsAvailable(item.key);
              const disabled = isPending || available <= 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.title}
                  disabled={disabled}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{available} left</span>
                </button>
              );
            })}
            {/* Previously this menu was a dead end at 0 credits — disabled
                with no indication of how to get more. */}
            <Link
              href="/plan"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-1 rounded-sm border-t border-border px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted"
            >
              Buy more credits
            </Link>
          </div>,
          document.body,
        )}
    </>
  );
}
