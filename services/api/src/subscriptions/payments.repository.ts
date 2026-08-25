import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type PaymentSource = 'subscription_new' | 'subscription_renewal' | 'credit_pack' | 'credit_cart';

export interface RecordPaymentInput {
  agentId?: string;
  source: PaymentSource;
  tierId?: string;
  creditPackId?: string;
  billingInterval?: 'month' | 'year';
  // Real Stripe-confirmed amount (already converted out of the smallest
  // currency unit by the caller) — never a list price looked up after the
  // fact. See 0065_payments_ledger.sql's comment for why.
  amount: number;
  currency: string;
  stripeReferenceId: string;
  stripeCustomerId?: string;
}

// Lives here (not services/api/src/admin/) because this table's only
// writer is SubscriptionsController's Stripe webhook — same "repository
// lives with its writer" convention SubscriptionsRepository itself
// follows. Read side (Super Admin's revenue dashboard) has its own
// repository under admin/.
@Injectable()
export class PaymentsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // Stripe webhooks can redeliver the same event — onConflict +
  // ignoreDuplicates makes a redelivery a safe no-op instead of a
  // duplicate ledger row, keyed on the Stripe object id that produced this
  // payment (checkout.session.completed -> session.id;
  // invoice.payment_succeeded -> invoice.id).
  async record(input: RecordPaymentInput): Promise<void> {
    const { error } = await this.supabase.client.from('payments').upsert(
      {
        agent_id: input.agentId,
        source: input.source,
        tier_id: input.tierId,
        credit_pack_id: input.creditPackId,
        billing_interval: input.billingInterval,
        amount: input.amount,
        currency: input.currency,
        stripe_reference_id: input.stripeReferenceId,
        stripe_customer_id: input.stripeCustomerId,
      },
      { onConflict: 'stripe_reference_id', ignoreDuplicates: true },
    );
    if (error) throw error;
  }
}
