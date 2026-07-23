import { Role } from '../common/types';
export type ChatbotTool = 'search_listings' | 'capture_lead' | 'get_expert_contact' | 'rank_listings_for_price_reduction' | 'portfolio_insights' | 'intake_documents' | 'intake_photos';
export declare class RoleCapabilityResolver {
    resolve(role: Role): ChatbotTool[];
}
