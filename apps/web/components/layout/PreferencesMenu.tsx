'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AREA_UNIT_OPTIONS, AreaUnit, CURRENCY_OPTIONS, usePreferencesViewModel } from '@jayedaad/core';
import { Check, ChevronLeft, DollarSign, Ruler, Settings } from 'lucide-react';

type View = 'menu' | 'currency' | 'area';

// Zameen-style gear icon -> "Change Currency"/"Change Area Unit" -> pick a
// value. The underlying storage (user_preferences table, services/api's
// preferences module, usePreferencesViewModel) already existed and worked
// end-to-end — the only picker anywhere lived inside the agent-only
// agent-settings page, so buyers/owners had no way to reach either
// preference at all despite the API being role-agnostic. Mounted in
// Header.tsx next to the user-avatar menu; only rendered for signed-in
// users, same auth gate usePreferencesViewModel's own query already has
// (GET /preferences requires a session).
export function PreferencesMenu() {
  const { preferences, updatePreferences } = usePreferencesViewModel();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function close() {
    setOpen(false);
    setView('menu');
  }

  function selectCurrency(code: string) {
    updatePreferences.mutate({ preferredCurrency: code });
    close();
  }

  function selectAreaUnit(value: AreaUnit) {
    updatePreferences.mutate({ preferredAreaUnit: value });
    close();
  }

  if (!preferences) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Currency and area unit preferences"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <Settings className="h-4.5 w-4.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-10 mt-2 w-56 origin-top-right overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-lg"
          >
            {view === 'menu' && (
              <>
                <button
                  type="button"
                  onClick={() => setView('area')}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  Change Area Unit
                </button>
                <button
                  type="button"
                  onClick={() => setView('currency')}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Change Currency
                </button>
              </>
            )}

            {view === 'currency' && (
              <>
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                {CURRENCY_OPTIONS.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => selectCurrency(currency.code)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {currency.label}
                    {preferences.preferredCurrency === currency.code && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </>
            )}

            {view === 'area' && (
              <>
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                {AREA_UNIT_OPTIONS.map((unit) => (
                  <button
                    key={unit.value}
                    type="button"
                    onClick={() => selectAreaUnit(unit.value)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {unit.label}
                    {preferences.preferredAreaUnit === unit.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
