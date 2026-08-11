import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCreditPackDto, UpdateCreditPackDto } from './dto/credit-pack.dto';

// Standalone (à la carte) credit purchases — mirrors SubscriptionTiersRepository's
// shape closely: public read (agents need to see what's buyable before
// checkout), Super Admin-only writes.
@Injectable()
export class CreditPacksRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // Public listing (SubscriptionsController.creditsCheckout) only ever
  // offers active packs — inactive ones stay visible to the admin table
  // via includeInactive, same as a soft-delete/retire, not a hard delete.
  async list(includeInactive = false) {
    let query = this.supabase.client.from('credit_packs').select('*').order('credit_type').order('price');
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.client.from('credit_packs').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(input: CreateCreditPackDto) {
    const { data, error } = await this.supabase.client
      .from('credit_packs')
      .insert({
        name: input.name,
        credit_type: input.creditType,
        quantity: input.quantity,
        price: input.price ?? 0,
        stripe_price_id: input.stripePriceId,
        active: input.active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, input: UpdateCreditPackDto) {
    const { data, error } = await this.supabase.client
      .from('credit_packs')
      .update({
        name: input.name,
        credit_type: input.creditType,
        quantity: input.quantity,
        price: input.price,
        stripe_price_id: input.stripePriceId,
        active: input.active,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('credit_packs').delete().eq('id', id);
    if (error) throw error;
  }
}
