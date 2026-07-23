import { SupabaseService } from '../supabase/supabase.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
export declare class DevelopersRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    list(filters?: {
        city?: string;
    }): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        whatsapp: any;
        city: any;
    }[]>;
    findBySlug(slug: string): Promise<{
        projectCount: number;
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        whatsapp: any;
        city: any;
    }>;
    create(input: CreateDeveloperDto): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        whatsapp: any;
        city: any;
    }>;
    update(id: string, input: UpdateDeveloperDto): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        whatsapp: any;
        city: any;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
}
