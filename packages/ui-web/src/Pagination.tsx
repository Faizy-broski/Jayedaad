import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from './lib/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Shared Previous/Page X of Y/Next control — previously hand-rolled
// identically (same markup, same Button/ChevronLeft/ChevronRight) across
// ProjectsListView.tsx and the admin blog/crm/listings/verification-log/
// developers pages. Deliberately takes totalPages, not total+pageSize —
// every caller already computes totalPages = Math.max(1, Math.ceil(total /
// pageSize)) itself, so this stays pure rendering, not arithmetic. Renders
// nothing when there's only one page, same as every existing call site's
// `{totalPages > 1 && (...)}` guard, just moved inside so callers don't
// have to repeat it.
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
        Previous
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
        <ChevronRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
