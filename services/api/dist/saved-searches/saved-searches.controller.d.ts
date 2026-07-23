import { SavedSearchesRepository } from './saved-searches.repository';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
export declare class SavedSearchesController {
    private readonly savedSearches;
    constructor(savedSearches: SavedSearchesRepository);
    list(req: any): Promise<any[]>;
    create(req: any, body: CreateSavedSearchDto): Promise<any>;
    update(req: any, id: string, body: UpdateSavedSearchDto): Promise<any>;
    remove(req: any, id: string): Promise<void>;
}
