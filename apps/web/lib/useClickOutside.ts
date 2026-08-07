import { useEffect, type RefObject } from 'react';

// Closes any floating panel (filter dropdowns, menus) on an outside
// pointerdown — pointerdown (not click) so it fires before a subsequent
// click handler elsewhere, matching how most dropdown libraries behave.
export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, onOutside, active]);
}
