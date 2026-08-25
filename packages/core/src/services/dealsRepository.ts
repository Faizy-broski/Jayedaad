import { httpClient } from './httpClient';
import { Deal, DealType, ListingStatus } from '../models';

// Mirrors services/api/src/deals/dto/mark-sold.dto.ts's MarkDealBaseDto —
// commissionRate/closedAt/notes are shared, only the amount field's
// name/meaning differs per action (see MarkSoldInput/MarkRentedInput below).
export interface MarkDealBaseInput {
  // Percent (0-100). Overrides the agency's defaultCommissionRate for this
  // one deal — falls back to the agency default, then the platform default,
  // server-side.
  commissionRate?: number;
  // Defaults to today (server-side) when omitted.
  closedAt?: string;
  notes?: string;
}

export interface MarkSoldInput extends MarkDealBaseInput {
  salePrice: number;
}

export interface MarkRentedInput extends MarkDealBaseInput {
  monthlyRent: number;
}

// Returned by markSold/markRented — DealsRepository.markClosed's response,
// distinct from the richer Deal shape GET /deals returns (no
// listingTitle/agentName here, since no join runs on the write path).
export interface MarkDealResult {
  deal: Omit<Deal, 'listingTitle' | 'agentName'>;
  listing: { id: string; status: ListingStatus };
}

export interface DealListFilters {
  // Agency Admin-only, same "ignored, not rejected" convention as
  // LeadListFilters.scope — falls back to own-agent scope for a non-admin
  // agent.
  scope?: 'own' | 'agency';
  dealType?: DealType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface DealListResult {
  items: Deal[];
  total: number;
  page: number;
  pageSize: number;
}

// The revenue ledger's write side (Mark Sold/Mark Rented, called from the
// listings endpoints — see ListingsController — since they're listing
// status transitions, same family as boostListing/renewListing) and read
// side (GET /deals). Mirrors listingsRepository.ts's style exactly.
export const dealsRepository = {
  markSold: async (listingId: string, input: MarkSoldInput): Promise<MarkDealResult> => {
    const { data } = await httpClient.post(`/listings/${listingId}/mark-sold`, input);
    return data;
  },

  markRented: async (listingId: string, input: MarkRentedInput): Promise<MarkDealResult> => {
    const { data } = await httpClient.post(`/listings/${listingId}/mark-rented`, input);
    return data;
  },

  list: async (filters: DealListFilters): Promise<DealListResult> => {
    const { data } = await httpClient.get('/deals', { params: filters });
    return data;
  },
};
