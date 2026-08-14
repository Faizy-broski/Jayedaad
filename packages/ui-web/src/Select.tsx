import {
  Children,
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './lib/cn';

// Module-level (not React state/context) so any two <Select> instances
// anywhere on the page coordinate without needing a shared provider —
// opening one now always closes whichever other one was open, instead of
// two dropdown panels being visibly open at once (see the position:fixed
// portal below for why that used to render as an outright visual collision,
// not just a confusing double-click state).
let closeCurrentlyOpenSelect: (() => void) | null = null;

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  // Not a native <select> attribute — shown when no option is selected
  // (i.e. value is '' and there's no matching <option>). Most call sites
  // don't need this since they already pass a `<option value="">Select
  // X</option>` placeholder option, but it's available for the rare one
  // that doesn't.
  placeholder?: string;
}

interface ParsedOption {
  value: string;
  label: string;
  disabled: boolean;
}

// Flattens the <option>/<optgroup> children callers already pass (the same
// markup a native <select> takes) into a plain list this component can
// render itself. Anything that isn't an <option> is ignored rather than
// thrown on — defensive, since nothing in this codebase passes anything
// else, but a silent no-op is safer than a crash if that ever changes.
function parseOptions(children: ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];
  function walk(nodes: ReactNode) {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === 'option') {
        const props = child.props as { value?: string; children?: ReactNode; disabled?: boolean };
        options.push({
          value: String(props.value ?? ''),
          label: typeof props.children === 'string' ? props.children : String(props.children ?? ''),
          disabled: !!props.disabled,
        });
      } else if (child.type === 'optgroup') {
        const props = child.props as { children?: ReactNode };
        walk(props.children);
      }
    });
  }
  walk(children);
  return options;
}

// Custom animated listbox replacing what used to be a plain native
// <select> — kept fully drop-in (same value/onChange/children-as-<option>
// API, minus `multiple`) so none of this app's ~20 call sites needed to
// change. A real, visually-hidden native <select> is kept mounted in sync
// (same value/required/disabled) purely so native form-constraint
// validation ("please select an item") still fires on submit — it's
// tabIndex={-1} (out of the tab order; the visible button is the real
// keyboard/tap target) but still focusable via .focus(), which is exactly
// what the browser calls to show that validation bubble.
export function Select({ value, onChange, children, className, required, disabled, id, placeholder, ...rest }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  // Screen coordinates for the portal below — null until this instance has
  // opened once, so unopened Selects (there can be dozens in a list) don't
  // carry a portaled DOM node at all.
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  const options = useMemo(() => parseOptions(children), [children]);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      // The dropdown itself now lives in a document.body portal, outside
      // containerRef's subtree — without also checking listRef, every click
      // on an option would register as "outside" and close the list before
      // its own onClick could fire.
      if (containerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Module-level singleton so opening this Select always closes whichever
  // other one was open — previously two dropdown panels could be open at
  // once, which (combined with each row being its own CSS stacking context,
  // see the portal below) rendered as two option lists visibly colliding.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpenRef.current(false);
    closeCurrentlyOpenSelect?.();
    closeCurrentlyOpenSelect = close;
    return () => {
      if (closeCurrentlyOpenSelect === close) closeCurrentlyOpenSelect = null;
    };
  }, [open]);

  // Positions the portaled dropdown against the trigger button in viewport
  // coordinates, kept in sync with scrolling/resizing while open. Rendering
  // via position:fixed + a portal (below) instead of position:absolute
  // inside this component's own div sidesteps a real bug: any ancestor with
  // a CSS transform (e.g. Framer Motion's whileHover on a list row) creates
  // a new stacking context, which traps an absolutely-positioned dropdown
  // inside that row's own local z-order — it can't paint above a *later*
  // sibling row no matter how high its z-index is.
  useEffect(() => {
    if (!open) return;
    function updateRect() {
      const el = buttonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: r.width });
    }
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  useEffect(() => {
    if (open) setHighlighted(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLLIElement>(`[data-index="${highlighted}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, highlighted]);

  function selectOption(option: ParsedOption) {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value } } as unknown as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const option = options[highlighted];
      if (option) selectOption(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <select
        ref={hiddenSelectRef}
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      >
        {children}
      </select>

      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...(rest as Record<string, unknown>)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className={cn('truncate', !selected?.value && 'text-muted-foreground')}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* Portaled to document.body and positioned in viewport coordinates
          (not relative to this div) — see the rect-tracking effect above
          for why: a position:absolute list here would be confined to
          whatever CSS stacking context this Select's row/card ancestor
          creates, and couldn't reliably paint above sibling rows. */}
      {rect &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{ top: rect.top + 6, left: rect.left, width: rect.width }}
            className={cn(
              'fixed z-50 max-h-60 origin-top overflow-auto rounded-md border border-border bg-background p-1 shadow-lg transition-all duration-150 ease-out',
              open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0',
            )}
          >
            {options.map((option, index) => (
              <li
                key={`${option.value}-${index}`}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => selectOption(option)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-sm transition-colors',
                  option.disabled && 'pointer-events-none opacity-50',
                  index === highlighted ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <CheckIcon />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}

// Inline SVGs rather than a lucide-react import — ui-web doesn't depend on
// an icon library today (see CountryCodeSelect's flag-emoji comment for the
// same "avoid a new dependency" rationale), so two tiny paths beat adding one.
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
