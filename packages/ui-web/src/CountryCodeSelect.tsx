import { ChangeEvent, KeyboardEvent, SelectHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from './lib/cn';

export interface CountryCodeOption {
  name: string;
  dialCode: string;
  iso2: string;
}

export interface CountryCodeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  countries: CountryCodeOption[];
  value: string;
  onChange: (dialCode: string) => void;
}

// Regional-indicator flag emoji computed from a 2-letter ISO code — no
// image assets, works cross-platform.
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// Same animated-listbox treatment as Select (see that file for the
// rationale) — a searchable one here specifically, since a ~240-country
// list is unusable to scroll through blind. A visually-hidden native
// <select> stays in sync for the same reason: native form-constraint
// validation on a `required` phone-country field needs a real, focusable
// <select> to anchor its "please select an item" bubble to.
export const CountryCodeSelect = ({ countries, value, onChange, className, disabled, required, id, ...rest }: CountryCodeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = countries.find((c) => c.dialCode === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q) || c.dialCode.includes(q),
    );
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlighted(Math.max(0, countries.findIndex((c) => c.dialCode === value)));
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
    // Deliberately [open]-only — re-running this on every `countries`/`value`
    // change would refocus the search input and reset the highlight mid-type.
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLLIElement>(`[data-index="${highlighted}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, highlighted]);

  function selectCountry(country: CountryCodeOption) {
    onChange(country.dialCode);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const country = filtered[highlighted];
      if (country) selectCountry(country);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <select
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      >
        {countries.map((country) => (
          <option key={`${country.iso2}-${country.dialCode}`} value={country.dialCode}>
            {country.iso2} +{country.dialCode}
          </option>
        ))}
      </select>

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...(rest as Record<string, unknown>)}
        className={cn(
          'flex h-10 w-auto shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className="truncate">
          {selected ? `${flagEmoji(selected.iso2)} +${selected.dialCode}` : 'Select'}
        </span>
        <ChevronIcon open={open} />
      </button>

      <div
        className={cn(
          'absolute z-50 mt-1.5 w-64 origin-top overflow-hidden rounded-md border border-border bg-background shadow-lg transition-all duration-150 ease-out',
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0',
        )}
      >
        <div className="border-b border-border p-2">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search country or code…"
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <ul ref={listRef} role="listbox" className="max-h-56 overflow-auto p-1">
          {filtered.length === 0 && <li className="px-2.5 py-2 text-sm text-muted-foreground">No matches.</li>}
          {filtered.map((country, index) => (
            <li
              key={`${country.iso2}-${country.dialCode}`}
              data-index={index}
              role="option"
              aria-selected={country.dialCode === value}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => selectCountry(country)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-sm transition-colors',
                index === highlighted ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <span>{flagEmoji(country.iso2)}</span>
                <span className="truncate">{country.name}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">+{country.dialCode}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
CountryCodeSelect.displayName = 'CountryCodeSelect';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
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
