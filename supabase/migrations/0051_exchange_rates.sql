-- Real PKR-based FX rates, backing actual currency conversion
-- (formatPrice()'s own comment previously admitted "no FX conversion
-- exists" — every non-PKR "currency" was just the raw PKR number
-- relabeled with a different symbol). Single-row cache, kept fresh by
-- ExchangeRatesService's hourly cron (services/api/src/exchange-rates) —
-- same "one row, upserted in place" shape as user_preferences.
create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null default 'PKR',
  -- { "USD": 0.0036, "GBP": 0.0028, "CAD": 0.0049, "SAR": 0.0135, "AED": 0.0132 }
  -- — 1 unit of base_currency expressed in each target currency.
  rates jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Public read — GET /exchange-rates is unauthenticated (rates aren't
-- user-specific and every price display needs them). Service role
-- (services/api's cron) bypasses RLS for the write side, same as every
-- other admin-managed/system-managed table in this schema.
alter table public.exchange_rates enable row level security;
create policy exchange_rates_select_all on public.exchange_rates for select using (true);
