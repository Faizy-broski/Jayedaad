import { LeadsRepository } from './leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
export declare class LeadsController {
    private readonly leads;
    constructor(leads: LeadsRepository);
    create(body: CreateLeadDto): Promise<any>;
    list(req: any, status?: any, listingId?: string): Promise<any[]>;
    addNote(req: any, id: string, body: string): Promise<void>;
    updateStatus(req: any, id: string, status: any): Promise<void>;
    assign(req: any, id: string, agentId: string): Promise<void>;
}
