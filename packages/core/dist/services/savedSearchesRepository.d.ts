import { AlertFrequency, SavedSearch } from '../models';
export declare const savedSearchesRepository: {
    list: () => Promise<SavedSearch[]>;
    remove: (id: string) => Promise<void>;
    updateAlertFrequency: (id: string, alertFrequency: AlertFrequency) => Promise<SavedSearch>;
};
