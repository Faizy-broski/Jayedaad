import { DevelopersRepository } from './developers.repository';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
export declare class DevelopersController {
    private readonly developers;
    constructor(developers: DevelopersRepository);
    list(city?: string): Promise<{
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
    create(body: CreateDeveloperDto): Promise<{
        id: any;
        name: any;
        slug: any;
        logo_url: any;
        description: any;
        phone: any;
        whatsapp: any;
        city: any;
    }>;
    update(id: string, body: UpdateDeveloperDto): Promise<{
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
