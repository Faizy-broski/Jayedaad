import { SupabaseService } from '../supabase/supabase.service';
import { CreateSubscriptionTierDto, UpdateSubscriptionTierDto } from './dto/subscription-tier.dto';
export declare class SubscriptionTiersRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    list(): Promise<any[]>;
    create(input: CreateSubscriptionTierDto): Promise<any>;
    update(id: string, input: UpdateSubscriptionTierDto): Promise<any>;
    remove(id: string): Promise<void>;
}
