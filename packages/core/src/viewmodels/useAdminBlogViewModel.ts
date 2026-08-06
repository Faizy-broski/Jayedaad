import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blogRepository } from '../services/blogRepository';
import { CreateBlogCategoryInput, CreateBlogPostInput, UpdateBlogPostInput } from '../models';

// Super Admin blog management — full CRUD across every status, mirrors
// useDevelopersViewModel's shape. Listing (listAll) is a separate endpoint
// from the public one (see blogRepository.listAll vs .list) since admins
// need to see drafts too. Server-side paginated (see BlogRepository.listAll
// on the API side) — a table with thousands of posts can't load every row
// at once.
export function useAdminBlogViewModel(filters: { page?: number; pageSize?: number; search?: string } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'blog', 'posts', filters];

  const query = useQuery({
    queryKey,
    queryFn: () => blogRepository.listAll(filters),
  });

  const categoriesQuery = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: () => blogRepository.listCategories(),
  });

  // Partial key (no filters) so every page/search variant currently cached
  // gets invalidated, not just the one this hook instance is looking at.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
    queryClient.invalidateQueries({ queryKey: ['blog', 'posts'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateBlogPostInput) => blogRepository.create(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBlogPostInput }) => blogRepository.update(id, input),
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' }) => blogRepository.setStatus(id, status),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => blogRepository.remove(id),
    onSuccess: invalidate,
  });

  const uploadCover = useMutation({
    mutationFn: ({ id, file }: { id: string; file: any }) => blogRepository.uploadCover(id, file),
    onSuccess: invalidate,
  });

  const createCategory = useMutation({
    mutationFn: (input: CreateBlogCategoryInput) => blogRepository.createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog', 'categories'] }),
  });

  return {
    posts: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? filters.pageSize ?? 20,
    isLoading: query.isLoading,
    categories: categoriesQuery.data ?? [],
    create,
    update,
    setStatus,
    remove,
    uploadCover,
    createCategory,
  };
}

// Single-post admin fetch (any status) — backs the editor page, which
// needs to load an existing draft, not just published posts.
export function useAdminBlogPostViewModel(id: string | undefined) {
  const query = useQuery({
    queryKey: ['admin', 'blog', 'posts', id],
    queryFn: () => blogRepository.findById(id!),
    enabled: !!id,
  });

  return { post: query.data, isLoading: query.isLoading };
}
