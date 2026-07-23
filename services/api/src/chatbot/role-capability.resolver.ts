import { Injectable } from '@nestjs/common';
import { Role } from '../common/types';

export type ChatbotTool =
  | 'search_listings'
  | 'capture_lead'
  | 'get_expert_contact'
  | 'rank_listings_for_price_reduction'
  | 'portfolio_insights'
  | 'intake_documents'
  | 'intake_photos';

// One assistant, capabilities modeled per role [Spec §3 / Reqs §3.1]. The
// lister flow's manifest structurally EXCLUDES any verification-decision tool —
// per [Spec §3]/[Reqs §3.4] the bot must never verify a listing, so that
// guarantee lives here (no such tool exists for 'owner'), not in a prompt
// instruction that could be bypassed by a clever user message.
const ROLE_TOOL_MANIFESTS: Partial<Record<Role, ChatbotTool[]>> = {
  buyer: ['search_listings', 'capture_lead', 'get_expert_contact'],
  agent: ['rank_listings_for_price_reduction', 'portfolio_insights', 'get_expert_contact'],
  owner: ['intake_documents', 'intake_photos', 'get_expert_contact'],
};

@Injectable()
export class RoleCapabilityResolver {
  resolve(role: Role): ChatbotTool[] {
    return ROLE_TOOL_MANIFESTS[role] ?? ['get_expert_contact'];
  }
}
