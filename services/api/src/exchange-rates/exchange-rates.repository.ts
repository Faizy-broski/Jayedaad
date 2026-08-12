import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface ExchangeRatesSnapshot {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

// Single-row cache — same "one row, upserted in place" shape as
// user_preferences. Never returns null/undefined rates to a caller: no row
// yet (first boot, before ExchangeRatesService's first cron tick) reads
// back as an empty rates map + updatedAt: null, which every price-display
// call site treats as "not loaded yet," not as "real 1:1 parity."
@Injectable()
export class ExchangeRatesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async getLatest(): Promise<ExchangeRatesSnapshot> {
    const { data, error } = await this.supabase.client
      .from('exchange_rates')
      .select('base_currency, rates, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { base: 'PKR', rates: {}, updatedAt: null };
    return { base: data.base_currency, rates: data.rates, updatedAt: data.updated_at };
  }

  // Upsert-in-place on whatever row already exists (there's ever only one)
  // rather than inserting a new row per fetch — this table is a live cache,
  // not a history log.
  async setLatest(base: string, rates: Record<string, number>): Promise<void> {
    const { data: existing, error: findError } = await this.supabase.client
      .from('exchange_rates')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (findError) throw findError;

    const { error } = await this.supabase.client
      .from('exchange_rates')
      .upsert({ id: existing?.id, base_currency: base, rates, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
}
