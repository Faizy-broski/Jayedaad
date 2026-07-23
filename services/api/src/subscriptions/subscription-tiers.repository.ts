import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSubscriptionTierDto, UpdateSubscriptionTierDto } from './dto/subscription-tier.dto';

// Subscription plans — Super Admin creates/edits/retires them at runtime
// [Reqs §8]. Reads are public: agents need to see available tiers to
// understand what they'd be upgrading to.
@Injectable()
export class SubscriptionTiersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase.client.from('subscription_tiers').select('*').order('price');
    if (error) throw error;
    return data;
  }

  async create(input: CreateSubscriptionTierDto) {
    const { data, error } = await this.supabase.client
      .from('subscription_tiers')
      .insert({
        name: input.name,
        listing_quota: input.listingQuota,
        price: input.price ?? 0,
        analytics_depth: input.analyticsDepth,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, input: UpdateSubscriptionTierDto) {
    const { data, error } = await this.supabase.client
      .from('subscription_tiers')
      .update({
        name: input.name,
        listing_quota: input.listingQuota,
        price: input.price,
        analytics_depth: input.analyticsDepth,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Blocked by the FK from subscriptions.tier_id if any agent is currently
  // on this plan — a Postgres FK-violation error, not a silent orphan.
  async remove(id: string) {
    const { error } = await this.supabase.client.from('subscription_tiers').delete().eq('id', id);
    if (error) throw error;
  }
}
