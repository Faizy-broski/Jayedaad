import { httpClient } from './httpClient';
import { UserPreferences } from '../models';

// Mirrors services/api/src/preferences — self-scoped via the caller's own
// JWT (no id param, unlike agentsRepository), any authenticated role.
export const preferencesRepository = {
  get: async (): Promise<UserPreferences> => {
    const { data } = await httpClient.get('/preferences');
    return data;
  },

  update: async (input: Partial<UserPreferences>): Promise<UserPreferences> => {
    const { data } = await httpClient.patch('/preferences', input);
    return data;
  },
};
