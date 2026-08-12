import { useQuery } from '@tanstack/react-query';
import { exchangeRatesRepository } from '../services/exchangeRatesRepository';

// Public (no enabled: !!user gate, unlike usePreferencesViewModel) — every
// price display needs these, including pages a signed-out visitor can
// browse. Long staleTime: the backend only refreshes this cache once an
// hour (services/api's ExchangeRatesService cron), so refetching more
// often than that just re-fetches the exact same cached row.
export function useExchangeRatesViewModel() {
  const query = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => exchangeRatesRepository.getLatest(),
    staleTime: 60 * 60_000,
  });

  return {
    base: query.data?.base ?? 'PKR',
    rates: query.data?.rates ?? {},
    updatedAt: query.data?.updatedAt ?? null,
    isLoading: query.isLoading,
  };
}
