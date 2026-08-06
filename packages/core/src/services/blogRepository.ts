import { httpClient } from './httpClient';
import {
  BlogCategory,
  BlogPost,
  BlogPostListResult,
  CreateBlogCategoryInput,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from '../models';

// services/api/src/blog/blog.repository.ts already returns camelCase (its
// own mapRow()), unlike developersRepository.ts's raw snake_case rows — no
// client-side mapping needed here.
export const blogRepository = {
  // Public — always status='published'. Backs both homepages' Property
  // Tips/Market Insights sections and the full /blog list.
  list: async (filters: { limit?: number } = {}): Promise<BlogPost[]> => {
    const { data } = await httpClient.get('/blog', { params: filters });
    return data;
  },

  findBySlug: async (slug: string): Promise<BlogPost> => {
    const { data } = await httpClient.get(`/blog/${slug}`);
    return data;
  },

  listCategories: async (): Promise<BlogCategory[]> => {
    const { data } = await httpClient.get('/blog/categories');
    return data;
  },

  // Everything below is Super Admin-only server-side.
  createCategory: async (input: CreateBlogCategoryInput): Promise<BlogCategory> => {
    const { data } = await httpClient.post('/blog/categories', input);
    return data;
  },

  listAll: async (filters: { page?: number; pageSize?: number; search?: string } = {}): Promise<BlogPostListResult> => {
    const { data } = await httpClient.get('/blog/admin/all', { params: filters });
    return data;
  },

  findById: async (id: string): Promise<BlogPost> => {
    const { data } = await httpClient.get(`/blog/admin/${id}`);
    return data;
  },

  create: async (input: CreateBlogPostInput): Promise<BlogPost> => {
    const { data } = await httpClient.post('/blog', input);
    return data;
  },

  update: async (id: string, input: UpdateBlogPostInput): Promise<BlogPost> => {
    const { data } = await httpClient.patch(`/blog/${id}`, input);
    return data;
  },

  setStatus: async (id: string, status: 'draft' | 'published'): Promise<BlogPost> => {
    const { data } = await httpClient.patch(`/blog/${id}/status`, { status });
    return data;
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await httpClient.delete(`/blog/${id}`);
    return data;
  },

  // `file` is platform-specific (a browser File on web, a { uri, name, type }
  // asset object on React Native) — same untyped convention as
  // agentsRepository.uploadPhoto.
  uploadCover: async (id: string, file: any): Promise<BlogPost> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post(`/blog/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
