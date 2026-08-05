import { AlertFrequency, SavedSearch } from '../models';
export interface CreateSavedSearchInput {
    name?: string;
    filters: Record<string, unknown>;
    alertFrequency?: AlertFrequency;
}
export declare const savedSearchesRepository: {
    list: () => Promise<SavedSearch[]>;
    create: (input: CreateSavedSearchInput) => Promise<SavedSearch>;
    remove: (id: string) => Promise<void>;
    updateAlertFrequency: (id: string, alertFrequency: AlertFrequency) => Promise<SavedSearch>;
};
