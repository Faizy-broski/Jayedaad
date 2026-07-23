import { FavoritesRepository } from './favorites.repository';
export declare class FavoritesController {
    private readonly favorites;
    constructor(favorites: FavoritesRepository);
    list(req: any): Promise<{
        id: any;
        created_at: any;
        listings: {
            id: any;
            title: any;
            price: any;
            city: any;
            area: any;
            status: any;
        }[];
    }[]>;
    add(req: any, listingId: string): Promise<any>;
    remove(req: any, listingId: string): Promise<void>;
}
