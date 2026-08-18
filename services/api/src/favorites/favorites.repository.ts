import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

// The buyer-dashboard "saved/favorite listings" requirement [Reqs §6]/[Spec §8]
// — every method takes the requesting user's id and scopes the query to it,
// same "no unscoped variant" discipline as leads.repository.ts.
@Injectable()
export class FavoritesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .select(
        'id, created_at, listings (id, title, price, city, area, status), projects (id, name, slug, city, area, status, cover_image_url)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async add(userId: string, listingId: string) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .insert({ user_id: userId, listing_id: listingId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(userId: string, listingId: string) {
    const { error } = await this.supabase.client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    if (error) throw error;
  }

  async addProject(userId: string, projectId: string) {
    const { data, error } = await this.supabase.client
      .from('favorites')
      .insert({ user_id: userId, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async removeProject(userId: string, projectId: string) {
    const { error } = await this.supabase.client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);
    if (error) throw error;
  }
}
