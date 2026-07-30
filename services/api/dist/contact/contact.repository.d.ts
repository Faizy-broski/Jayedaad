import { SupabaseService } from '../supabase/supabase.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
export declare class ContactRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    create(input: CreateContactMessageDto): Promise<any>;
}
