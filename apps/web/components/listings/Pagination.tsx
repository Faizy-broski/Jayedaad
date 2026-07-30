'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

// Collapses long runs into a leading/trailing "…" so the strip stays a fixed
// height regardless of how many pages there are — always show first, last,
// current, and current's immediate neighbors.
function getPageItems(page: number, pageCount: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  const add = (n: number) => items.push(n);

  const keep = new Set([1, pageCount, page - 1, page, page + 1]);
  let previous = 0;
  for (let n = 1; n <= pageCount; n++) {
    if (!keep.has(n)) continue;
    if (previous && n - previous > 1) items.push('ellipsis');
    add(n);
    previous = n;
  }
  return items;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageItems(page, pageCount).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              item === page ? 'bg-heading-gradient text-primary-foreground' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
