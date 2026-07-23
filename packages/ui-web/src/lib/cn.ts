import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn/ui utility: clsx for conditional classes, tailwind-merge
// to resolve conflicting Tailwind utilities (e.g. a caller's className="p-4"
// correctly wins over a component's own default "p-2") instead of both
// ending up in the class list.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
