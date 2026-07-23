import { SupabaseService } from '../supabase/supabase.service';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
export declare class SubscriptionsRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    assign(agentId: string, input: AssignSubscriptionDto): Promise<any>;
    findForAgent(agentId: string): Promise<any>;
}
