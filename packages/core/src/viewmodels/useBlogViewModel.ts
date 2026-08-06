import { useQuery } from '@tanstack/react-query';
import { blogRepository } from '../services/blogRepository';

// Public blog reads — always status='published'. Backs both homepages'
// Property Tips/Market Insights sections (pass a limit) and the full
// /blog list page (no limit).
export function useBlogViewModel(filters: { limit?: number } = {}) {
  const query = useQuery({
    queryKey: ['blog', 'posts', filters],
    queryFn: () => blogRepository.list(filters),
  });

  const categoriesQuery = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: () => blogRepository.listCategories(),
  });

  return {
    posts: query.data ?? [],
    isLoading: query.isLoading,
    categories: categoriesQuery.data ?? [],
  };
}

export function useBlogPostViewModel(slug: string | undefined) {
  const query = useQuery({
    queryKey: ['blog', 'posts', 'slug', slug],
    queryFn: () => blogRepository.findBySlug(slug!),
    enabled: !!slug,
  });

  return { post: query.data, isLoading: query.isLoading };
}
