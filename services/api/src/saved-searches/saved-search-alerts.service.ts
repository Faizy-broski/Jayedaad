import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SavedSearchesRepository } from './saved-searches.repository';
import { ListingsRepository, ListingSearchFilters } from '../listings/listings.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';

const FREQUENCY_WINDOW_MS: Record<string, number> = {
  instant: 60 * 60 * 1000, // 1 hour
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

// Saved searches (saved_searches, 0007_favorites_and_saved_searches.sql)
// already store a filter set + an alert_frequency ('instant'|'daily'|
// 'weekly'|'off') — this is what makes that stored preference actually do
// something, mirroring RemindersService's @Cron shape.
//
// Honesty note (same convention as RemindersService's channel-delivery
// caveat): there's no listing-created webhook to trigger true real-time
// "instant" delivery, so every frequency is checked on the same hourly
// tick and self-gates by comparing now() against last_notified_at — an
// "instant" alert can be up to ~1 hour behind a matching listing going
// live, not truly instant.
@Injectable()
export class SavedSearchAlertsService {
  private readonly logger = new Logger(SavedSearchAlertsService.name);

  constructor(
    private readonly savedSearches: SavedSearchesRepository,
    private readonly listings: ListingsRepository,
    private readonly notifications: NotificationsRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkSavedSearches(): Promise<void> {
    const active = await this.savedSearches.listActive();
    const now = Date.now();

    for (const savedSearch of active) {
      const window = FREQUENCY_WINDOW_MS[savedSearch.alert_frequency];
      if (!window) continue; // unknown/'off' — listActive() already excludes 'off', defensive only

      const lastNotifiedAt = savedSearch.last_notified_at ? new Date(savedSearch.last_notified_at).getTime() : null;
      const due = lastNotifiedAt === null || now - lastNotifiedAt >= window;
      if (!due) continue;

      const createdAfter = savedSearch.last_notified_at ?? savedSearch.created_at;
      try {
        const filters = { ...(savedSearch.filters as ListingSearchFilters), createdAfter, pageSize: 5 };
        const results = await this.listings.findPublic(filters);
        if (results.total > 0) {
          const top = results.items[0];
          await this.notifications.create({
            userId: savedSearch.user_id,
            type: 'new_match',
            title: savedSearch.name ? `New matches for "${savedSearch.name}"` : 'New matching listings',
            body:
              results.total === 1
                ? `1 new listing matches your saved search.`
                : `${results.total} new listings match your saved search.`,
            relatedListingId: top?.id,
          });
        }
        // Always advance the window, even with zero matches — otherwise a
        // quiet period would make the next check re-scan the same range.
        await this.savedSearches.markNotified(savedSearch.id);
      } catch (err) {
        // One bad saved search (e.g. malformed stored filters) must not
        // block every other user's alerts from firing.
        this.logger.error(`Failed to process saved search ${savedSearch.id}`, err as Error);
      }
    }
  }
}
