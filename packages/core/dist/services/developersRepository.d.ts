import { CreateDeveloperInput, Developer, UpdateDeveloperInput } from '../models';
export declare const developersRepository: {
    list: (filters?: {
        city?: string;
    }) => Promise<Developer[]>;
    findBySlug: (slug: string) => Promise<Developer>;
    create: (input: CreateDeveloperInput) => Promise<Developer>;
    update: (id: string, input: UpdateDeveloperInput) => Promise<Developer>;
    remove: (id: string) => Promise<{
        id: string;
    }>;
};
