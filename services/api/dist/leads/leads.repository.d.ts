import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
export interface LeadListFilters {
    status?: 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';
    listingId?: string;
}
export declare class LeadsRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    list(scope: AuthenticatedUser, filters: LeadListFilters): Promise<any[]>;
    create(input: CreateLeadDto): Promise<any>;
    assign(assignedBy: string, leadId: string, agentId: string): Promise<void>;
    addNote(scope: AuthenticatedUser, leadId: string, body: string): Promise<void>;
    updateStatus(scope: AuthenticatedUser, leadId: string, toStatus: 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost'): Promise<void>;
}
