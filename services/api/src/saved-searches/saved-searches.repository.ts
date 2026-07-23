import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Injectable()
export class SavedSearchesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async create(userId: string, input: CreateSavedSearchDto) {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .insert({
        user_id: userId,
        name: input.name,
        filters: input.filters,
        alert_frequency: input.alertFrequency ?? 'daily',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateAlertFrequency(userId: string, id: string, alertFrequency: string) {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .update({ alert_frequency: alertFrequency })
      .eq('id', id)
      .eq('user_id', userId) // scoped even though RLS also enforces this — defense in depth
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(userId: string, id: string) {
    const { error } = await this.supabase.client.from('saved_searches').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }
}
