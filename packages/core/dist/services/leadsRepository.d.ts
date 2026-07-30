import { Lead, LeadInquirerType, LeadSource, LeadStatus } from '../models';
export interface LeadListFilters {
    status?: LeadStatus;
    listingId?: string;
    agentId?: string;
}
export interface CreateLeadInput {
    listingId: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    source: LeadSource;
    inquirerType?: LeadInquirerType;
    wantsSimilarAlerts?: boolean;
}
export declare const leadsRepository: {
    list: (filters: LeadListFilters) => Promise<Lead[]>;
    create: (input: CreateLeadInput) => Promise<Lead>;
    addNote: (leadId: string, body: string) => Promise<any>;
    updateStatus: ({ leadId, status }: {
        leadId: string;
        status: LeadStatus;
    }) => Promise<any>;
    assign: (leadId: string, agentId: string) => Promise<void>;
};
