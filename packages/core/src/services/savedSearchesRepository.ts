import { httpClient } from './httpClient';
import { AlertFrequency, SavedSearch } from '../models';

// services/api/src/saved-searches returns raw snake_case rows — mapped here
// to match every other camelCase model in this package.
function mapRow(row: any): SavedSearch {
  return {
    id: row.id,
    name: row.name,
    filters: row.filters,
    alertFrequency: row.alert_frequency,
    lastNotifiedAt: row.last_notified_at,
    createdAt: row.created_at,
  };
}

export interface CreateSavedSearchInput {
  name?: string;
  filters: Record<string, unknown>;
  alertFrequency?: AlertFrequency;
}

// Self-scoped via the caller's own JWT (no id param), any authenticated role.
export const savedSearchesRepository = {
  list: async (): Promise<SavedSearch[]> => {
    const { data } = await httpClient.get('/saved-searches');
    return (data as any[]).map(mapRow);
  },

  // filters is whatever ListingSearchFilters shape the caller was searching
  // with — stored as jsonb server-side, replayed verbatim on future alert
  // matching (see services/api/src/saved-searches/dto/create-saved-search.dto.ts).
  create: async (input: CreateSavedSearchInput): Promise<SavedSearch> => {
    const { data } = await httpClient.post('/saved-searches', input);
    return mapRow(data);
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(`/saved-searches/${id}`);
  },

  updateAlertFrequency: async (id: string, alertFrequency: AlertFrequency): Promise<SavedSearch> => {
    const { data } = await httpClient.patch(`/saved-searches/${id}`, { alertFrequency });
    return mapRow(data);
  },
};
