import { httpClient } from './httpClient';
// services/api/src/saved-searches returns raw snake_case rows — mapped here
// to match every other camelCase model in this package.
function mapRow(row) {
    return {
        id: row.id,
        name: row.name,
        filters: row.filters,
        alertFrequency: row.alert_frequency,
        lastNotifiedAt: row.last_notified_at,
        createdAt: row.created_at,
    };
}
// Self-scoped via the caller's own JWT (no id param), any authenticated role.
export const savedSearchesRepository = {
    list: async () => {
        const { data } = await httpClient.get('/saved-searches');
        return data.map(mapRow);
    },
    // filters is whatever ListingSearchFilters shape the caller was searching
    // with — stored as jsonb server-side, replayed verbatim on future alert
    // matching (see services/api/src/saved-searches/dto/create-saved-search.dto.ts).
    create: async (input) => {
        const { data } = await httpClient.post('/saved-searches', input);
        return mapRow(data);
    },
    remove: async (id) => {
        await httpClient.delete(`/saved-searches/${id}`);
    },
    updateAlertFrequency: async (id, alertFrequency) => {
        const { data } = await httpClient.patch(`/saved-searches/${id}`, { alertFrequency });
        return mapRow(data);
    },
};
