import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

const DEVELOPER_COLUMNS = 'id, name, slug, logo_url, description, phone, whatsapp, city';

// A first-class entity promoted from what was a plain `developer_name` text
// column on `projects` — confirmed real on the Zameen New Projects page's
// "Select Developers" search dropdown and "Featured Developers" section
// (logo, phone, WhatsApp, project count). Mirrors AgenciesRepository:
// public reads, super_admin-only writes.
@Injectable()
export class DevelopersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list(filters: { city?: string } = {}) {
    let query = this.supabase.client.from('developers').select(DEVELOPER_COLUMNS).order('name', { ascending: true });

    if (filters.city) query = query.eq('city', filters.city);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Project count computed at query time — same "compute, never store"
  // discipline as AgenciesRepository.getStats().
  async findBySlug(slug: string) {
    const { data: developer, error } = await this.supabase.client
      .from('developers')
      .select(DEVELOPER_COLUMNS)
      .eq('slug', slug)
      .single();
    if (error) throw error;

    const { count, error: countError } = await this.supabase.client
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('developer_id', (developer as any).id);
    if (countError) throw countError;

    return { ...developer, projectCount: count ?? 0 };
  }

  async create(input: CreateDeveloperDto) {
    const { data, error } = await this.supabase.client
      .from('developers')
      .insert({
        name: input.name,
        slug: input.slug,
        logo_url: input.logoUrl,
        description: input.description,
        phone: input.phone,
        whatsapp: input.whatsapp,
        city: input.city,
      })
      .select(DEVELOPER_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, input: UpdateDeveloperDto) {
    const { data, error } = await this.supabase.client
      .from('developers')
      .update({
        name: input.name,
        logo_url: input.logoUrl,
        description: input.description,
        phone: input.phone,
        whatsapp: input.whatsapp,
        city: input.city,
      })
      .eq('id', id)
      .select(DEVELOPER_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  // Blocked by the FK from projects.developer_id if any project still
  // references this developer — a Postgres FK-violation error, not a
  // silent orphan (same discipline as SubscriptionTiersRepository.remove()).
  async remove(id: string) {
    const { error } = await this.supabase.client.from('developers').delete().eq('id', id);
    if (error) throw error;
    return { id };
  }
}
