import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type NotificationType =
  | 'price_drop'
  | 'new_match'
  | 'inquiry_reply'
  | 'verification_status'
  | 'lead_assigned'
  | 'reminder';

// In-app notification feed [Spec §2]. No public POST endpoint — notifications
// are created by other backend processes (verification actions, lead
// assignment, price-drop detection), never directly by a client. `create()`
// exists here for those future internal call sites to use; actual FCM/APNs
// push delivery is a separate, later integration.
@Injectable()
export class NotificationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async markRead(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markAllRead(userId: string) {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw error;
  }

  async create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    relatedListingId?: string;
    relatedLeadId?: string;
  }) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        related_listing_id: input.relatedListingId,
        related_lead_id: input.relatedLeadId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
