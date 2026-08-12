import { httpClient } from './httpClient';

export interface ExchangeRatesSnapshot {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

// GET /exchange-rates is public — no auth needed, rates aren't
// user-specific (see services/api/src/exchange-rates).
export const exchangeRatesRepository = {
  getLatest: async (): Promise<ExchangeRatesSnapshot> => {
    const { data } = await httpClient.get('/exchange-rates');
    return data;
  },
};
