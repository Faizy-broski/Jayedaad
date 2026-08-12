import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSubscriptionTierDto, UpdateSubscriptionTierDto } from './dto/subscription-tier.dto';
import { paginate, PaginationParams, resolvePagination } from '../common/pagination';

// Subscription plans — Super Admin creates/edits/retires them at runtime
// [Reqs §8]. Reads are public: agents need to see available tiers to
// understand what they'd be upgrading to.
@Injectable()
export class SubscriptionTiersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // Dual-mode: called with no page/pageSize, returns the full unpaginated
  // array exactly as before — needed by the agent-facing upgrade screen
  // (useSubscriptionViewModel), which must see every tier at once. Called
  // with page and/or pageSize (the Plans admin table), it paginates and
  // returns { items, total, page, pageSize }. Lowest-risk of the dual-mode
  // endpoints — tier counts are realistically tiny — added for consistency
  // with Agents/Users/Developers/Taxonomy. See services/api/src/common/
  // pagination.ts and admin.repository.ts::listAgentsOverview for the same
  // pattern applied elsewhere.
  async list(filters: PaginationParams = {}) {
    const paginated = filters.page != null || filters.pageSize != null;

    let query = this.supabase.client
      .from('subscription_tiers')
      .select('*', paginated ? { count: 'exact' } : undefined)
      .order('price');

    if (!paginated) {
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }

    const pagination = resolvePagination(filters);
    query = query.range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }

  async create(input: CreateSubscriptionTierDto) {
    const { data, error } = await this.supabase.client
      .from('subscription_tiers')
      .insert({
        name: input.name,
        listing_quota: input.listingQuota,
        price: input.price ?? 0,
        analytics_depth: input.analyticsDepth,
        hot_credits_per_period: input.hotCreditsPerPeriod ?? 0,
        super_hot_credits_per_period: input.superHotCreditsPerPeriod ?? 0,
        refresh_credits_per_period: input.refreshCreditsPerPeriod ?? 0,
        story_credits_per_period: input.storyCreditsPerPeriod ?? 0,
        stripe_price_id: input.stripePriceId,
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
        hot_credits_per_period: input.hotCreditsPerPeriod,
        super_hot_credits_per_period: input.superHotCreditsPerPeriod,
        refresh_credits_per_period: input.refreshCreditsPerPeriod,
        story_credits_per_period: input.storyCreditsPerPeriod,
        stripe_price_id: input.stripePriceId,
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
