import { Favorite } from '../models';
export declare const favoritesRepository: {
    list: () => Promise<Favorite[]>;
    add: (listingId: string) => Promise<Favorite>;
    remove: (listingId: string) => Promise<void>;
};
