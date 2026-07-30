import { UserPreferences } from '../models';
export declare const preferencesRepository: {
    get: () => Promise<UserPreferences>;
    update: (input: Partial<UserPreferences>) => Promise<UserPreferences>;
};
