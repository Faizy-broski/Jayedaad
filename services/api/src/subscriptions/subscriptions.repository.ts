import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

// The literal fix for "Current Plan: -" showing blank on the real Profolio
// dashboard screenshot from an earlier pass — nothing ever wrote to
// `subscriptions` until this method existed.
@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async assign(agentId: string, input: AssignSubscriptionDto) {
    const { data, error } = await this.supabase.client
      .from('subscriptions')
      .upsert(
        {
          agent_id: agentId,
          tier_id: input.tierId,
          status: 'active',
          current_period_end: input.currentPeriodEnd,
        },
        { onConflict: 'agent_id' },
      )
      .select('*, subscription_tiers (*)')
      .single();
    if (error) throw error;
    return data;
  }

  async findForAgent(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('subscriptions')
      .select('*, subscription_tiers (*)')
      .eq('agent_id', agentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}
