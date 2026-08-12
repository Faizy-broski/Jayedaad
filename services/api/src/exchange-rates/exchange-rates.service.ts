import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeRatesRepository } from './exchange-rates.repository';

// open.er-api.com — free, no API key/signup, and (unlike Frankfurter/other
// ECB-based free APIs, which don't publish PKR rates at all) natively
// supports PKR as a base currency, which this app needs since every stored
// listing price is PKR. Refreshed daily on their end; fetched here on an
// hourly cron, same @nestjs/schedule pattern as PlanLifecycleService/
// SavedSearchAlertsService.
const RATES_URL = 'https://open.er-api.com/v6/latest/PKR';
const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'CAD', 'SAR', 'AED'];

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(private readonly repository: ExchangeRatesRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async refresh(): Promise<void> {
    try {
      const response = await fetch(RATES_URL);
      if (!response.ok) {
        this.logger.error(`Exchange rate fetch failed — HTTP ${response.status}`);
        return;
      }
      const body = (await response.json()) as { result?: string; rates?: Record<string, number> };
      if (body.result !== 'success' || !body.rates) {
        this.logger.error(`Exchange rate fetch returned an unexpected payload: ${JSON.stringify(body).slice(0, 200)}`);
        return;
      }

      // Only the currencies this app's picker actually offers — no need to
      // cache/carry ~160 currencies open.er-api.com returns.
      const rates: Record<string, number> = {};
      for (const code of SUPPORTED_CURRENCIES) {
        if (typeof body.rates[code] === 'number') rates[code] = body.rates[code];
      }

      await this.repository.setLatest('PKR', rates);
      this.logger.log(`Exchange rates refreshed: ${JSON.stringify(rates)}`);
    } catch (err) {
      // Never let a failed fetch touch the cached row — stale-but-real
      // rates are far better than silently reverting to 1:1 "conversion."
      this.logger.error('Exchange rate refresh failed', err as Error);
    }
  }
}
