import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsRepository } from '../services/projectsRepository';
import { CreateProjectInput, ProjectSearchFilters, SetProjectVerificationStatusInput, UpdateProjectInput } from '../models';

// Public search — verified projects only (see
// ProjectsRepository.findPublic's includeUnverified gate server-side).
// Same shape as useListingSearchViewModel — searchPublic returns a page
// ({ items, total, page, pageSize }), adapted to a flat `projects` array
// while still exposing total/page/pageSize for future pagination UI.
export function useProjectsViewModel(filters: ProjectSearchFilters = {}) {
  const query = useQuery({
    queryKey: ['projects', 'public', filters],
    queryFn: () => projectsRepository.searchPublic(filters),
  });

  return {
    projects: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.pageSize ?? 20,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Infinite-scroll variant — backs mobile's ProjectsScreen "load more on
// scroll" results, fetching real 20-item pages (the API's own
// DEFAULT_PAGE_SIZE) instead of one big unbounded fetch.
export function useInfiniteProjectsViewModel(filters: ProjectSearchFilters = {}) {
  const query = useInfiniteQuery({
    queryKey: ['projects', 'public', 'infinite', filters],
    queryFn: ({ pageParam }) => projectsRepository.searchPublic({ ...filters, page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined),
  });

  return {
    projects: query.data?.pages.flatMap((p) => p.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  };
}

// Agent/Super Admin "manage" list — every project regardless of
// verification_status, plus create + approve/reject. Backs both
// /admin/projects and the agent-portal /projects list (both share
// apps/web/components/projects/ProjectsListView.tsx and ProjectForm.tsx).
export function useManageProjectsViewModel(filters: { city?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projects', 'manage', filters],
    queryFn: () => projectsRepository.listAll(filters),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const create = useMutation({
    mutationFn: (input: CreateProjectInput) => projectsRepository.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) => projectsRepository.update(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => projectsRepository.remove(id),
    onSuccess: invalidate,
  });

  const setVerificationStatus = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetProjectVerificationStatusInput }) =>
      projectsRepository.setVerificationStatus(id, input),
    onSuccess: invalidate,
  });

  return {
    projects: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    create,
    update,
    remove,
    setVerificationStatus,
  };
}

// Single-project fetch by id — backs the edit (Super Admin) / read-only
// view (agent) pages at /admin/projects/[id] and /projects/[id]. Requires
// agent/super_admin auth server-side (GET /projects/id/:id) — not usable by
// an anonymous or buyer-role viewer.
export function useProjectDetailViewModel(id: string | undefined) {
  const query = useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => projectsRepository.findById(id!),
    enabled: !!id,
  });

  return {
    project: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Public single-project fetch by slug (GET /projects/:slug, @Public()) —
// backs a real buyer-facing project detail screen. Unlike
// useProjectDetailViewModel above, requires no auth and only ever returns
// verified projects (see ProjectsRepository.findBySlug).
export function usePublicProjectDetailViewModel(slug: string | undefined) {
  const query = useQuery({
    queryKey: ['projects', 'public', 'detail', slug],
    queryFn: () => projectsRepository.findBySlug(slug!),
    enabled: !!slug,
  });

  return {
    project: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
