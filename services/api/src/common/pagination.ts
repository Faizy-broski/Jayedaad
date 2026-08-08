// Shared page/pageSize resolution + Supabase .range()/count normalization —
// previously reimplemented independently (with drifting MAX_PAGE_SIZE
// values, 50 vs 100) in leads.repository.ts, listings.repository.ts,
// verification.repository.ts, projects.repository.ts, blog.repository.ts.
// 100 is the canonical cap: it's already the max actually exercised
// (leads/verification/blog), and raising listings/projects from 50->100 is
// a no-op today since nothing requests a pageSize that high — it just
// removes the inconsistency between modules.
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ResolvedPagination {
  page: number;
  pageSize: number;
  from: number;
  to: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function resolvePagination(
  params: PaginationParams,
  opts?: { defaultPageSize?: number; maxPageSize?: number },
): ResolvedPagination {
  const defaultPageSize = opts?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = opts?.maxPageSize ?? MAX_PAGE_SIZE;
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const pageSize = Math.min(
    params.pageSize && params.pageSize > 0 ? Math.floor(params.pageSize) : defaultPageSize,
    maxPageSize,
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

// Awaits a Supabase query builder already configured with
// .select(cols, { count: 'exact' }) and .range(from, to), and normalizes
// the { data, error, count } result into a Page<T>. Callers that need
// extra work between building the query and awaiting it (existence
// pre-lookups, Promise.all with side-effect logging, etc.) should call
// resolvePagination() directly instead and build the Page<T> themselves.
export async function paginate<T>(
  query: PromiseLike<{ data: T[] | null; error: any; count: number | null }>,
  pagination: ResolvedPagination,
): Promise<Page<T>> {
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0, page: pagination.page, pageSize: pagination.pageSize };
}

// PostgREST's .or() filter string is itself a small DSL — strip characters
// that are syntactically significant in it (or in ILIKE patterns) rather
// than interpolate a raw user string into the filter. Previously duplicated
// verbatim in listings.repository.ts and projects.repository.ts.
export function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/[,()%]/g, ' ').trim();
}
