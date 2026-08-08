import { ConflictException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { paginate, PaginationParams, resolvePagination } from '../common/pagination';

const BLOG_POST_COLUMNS =
  'id, author_id, title, slug, excerpt, content, cover_image_url, read_time, status, published_at, created_at, updated_at, blog_categories (id, name, slug)';

function mapRow(row: any) {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    category: row.blog_categories ?? null,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    readTime: row.read_time,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Blog / Property Tips CMS — public reads are always status='published'
// (see listPublished/findPublishedBySlug); every other method here is
// admin-only, gated at the controller (@Roles('super_admin')), not here —
// same discipline as every other repository in this codebase.
@Injectable()
export class BlogRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async listPublished(filters: { limit?: number } = {}) {
    let query = this.supabase.client
      .from('blog_posts')
      .select(BLOG_POST_COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }

  async findPublishedBySlug(slug: string) {
    const { data, error } = await this.supabase.client
      .from('blog_posts')
      .select(BLOG_POST_COLUMNS)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  // Server-side paginated — a platform with thousands of posts can't ship
  // every row to the admin table on every load, same "count: 'exact' +
  // range()" pattern as ListingsRepository.searchPublic.
  async listAll(filters: PaginationParams & { search?: string } = {}) {
    const pagination = resolvePagination(filters);

    let query = this.supabase.client
      .from('blog_posts')
      .select(BLOG_POST_COLUMNS, { count: 'exact' })
      .order('updated_at', { ascending: false });
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    query = query.range(pagination.from, pagination.to);

    const page = await paginate(query, pagination);
    return { ...page, items: page.items.map(mapRow) };
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.client.from('blog_posts').select(BLOG_POST_COLUMNS).eq('id', id).single();
    if (error) throw error;
    return mapRow(data);
  }

  async create(authorId: string, input: CreateBlogPostDto) {
    const status = input.status ?? 'draft';
    const { data, error } = await this.supabase.client
      .from('blog_posts')
      .insert({
        author_id: authorId,
        title: input.title,
        slug: input.slug,
        category_id: input.categoryId,
        excerpt: input.excerpt,
        content: input.content,
        cover_image_url: input.coverImageUrl,
        read_time: input.readTime,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select(BLOG_POST_COLUMNS)
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async update(id: string, input: UpdateBlogPostDto) {
    const { data, error } = await this.supabase.client
      .from('blog_posts')
      .update({
        title: input.title,
        category_id: input.categoryId,
        excerpt: input.excerpt,
        content: input.content,
        cover_image_url: input.coverImageUrl,
        read_time: input.readTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(BLOG_POST_COLUMNS)
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  // The only path that sets/clears published_at — a plain update() call
  // never touches status, so a content edit can never silently flip a
  // draft live or vice versa.
  async setStatus(id: string, status: 'draft' | 'published') {
    const { data, error } = await this.supabase.client
      .from('blog_posts')
      .update({
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(BLOG_POST_COLUMNS)
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
    return { id };
  }

  // --- Categories — admin-managed lookup table, not a hardcoded enum -----
  // (mirrors property_type_categories' "Super Admin manages taxonomy at
  // runtime" convention). Public list is needed too, for filtering /blog
  // and for the admin editor's own dropdown.

  async listCategories() {
    const { data, error } = await this.supabase.client.from('blog_categories').select('id, name, slug').order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async createCategory(input: CreateBlogCategoryDto) {
    const { data, error } = await this.supabase.client
      .from('blog_categories')
      .insert({ name: input.name, slug: input.slug })
      .select('id, name, slug')
      .single();
    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('A category with this name already exists.');
      }
      throw error;
    }
    return data;
  }
}
