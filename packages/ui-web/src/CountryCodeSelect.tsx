import { ChangeEvent, SelectHTMLAttributes, forwardRef } from 'react';
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
// image assets, works cross-platform. Deliberately a native <select>, same
// accessible/no-new-dependency approach as ui-web's Select — the ~240-item
// list already gets OS-level type-ahead search for free.
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export const CountryCodeSelect = forwardRef<HTMLSelectElement, CountryCodeSelectProps>(
  ({ countries, value, onChange, className, ...props }, ref) => (
    <select
      ref={ref}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={cn(
        'flex h-10 w-auto shrink-0 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {countries.map((country) => (
        <option key={`${country.iso2}-${country.dialCode}`} value={country.dialCode}>
          {flagEmoji(country.iso2)} {country.iso2} +{country.dialCode}
        </option>
      ))}
    </select>
  ),
);
CountryCodeSelect.displayName = 'CountryCodeSelect';
