import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { DocumentsService } from '../documents/documents.service';

const AGENCY_COLUMNS =
  'id, name, slug, logo_url, description, phone, email, city, address, business_hours, verification_status';

export type OnboardingDocumentType = 'company_registration' | 'owner_id_card' | 'tax_certificate';

// Real business requirement: these 3 documents are required to onboard a
// company/agency — same literal list used for independent agents
// (agents.repository.ts), since an agency-affiliated agent is covered by
// their agency's own documents.
export const REQUIRED_ONBOARDING_DOCUMENT_TYPES: OnboardingDocumentType[] = [
  'company_registration',
  'owner_id_card',
  'tax_certificate',
];

// Zameen.com distinguishes an Agency (company) from an individual Agent, who
// may belong to one or work independently — agent_profiles.agency_id is
// nullable. Aggregate stats (listing counts, views) are deliberately NOT
// stored here — computed at query time, matching the single-source-of-truth
// principle already established for view counts [Reqs §4.3].
@Injectable()
export class AgenciesRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly documents: DocumentsService,
  ) {}

  async list(filters: { city?: string } = {}) {
    let query = this.supabase.client
      .from('agencies')
      .select(AGENCY_COLUMNS)
      .eq('verification_status', 'verified')
      .order('name', { ascending: true });

    if (filters.city) query = query.eq('city', filters.city);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findBySlug(slug: string) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .select(`${AGENCY_COLUMNS}, agent_profiles (id, display_name, title, photo_url)`)
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  }

  // Property inventory broken down by purpose + type — confirmed on a real
  // Zameen agency page ("12 Houses... for sale / 8 Buildings... for rent").
  // Not a stored figure: computed here from `listings` every call.
  async getStats(agencyId: string) {
    const { data: agentRows, error: agentError } = await this.supabase.client
      .from('agent_profiles')
      .select('id')
      .eq('agency_id', agencyId);
    if (agentError) throw agentError;

    const agentIds = (agentRows ?? []).map((r: any) => r.id);
    if (agentIds.length === 0) {
      return { forSaleCount: 0, forRentCount: 0, byPropertyType: [], byBoostTier: [] };
    }

    const { data: listingRows, error: listingError } = await this.supabase.client
      .from('listings')
      .select('purpose, boost_tier, property_types (label)')
      .eq('status', 'verified')
      .in('agent_id', agentIds);
    if (listingError) throw listingError;

    let forSaleCount = 0;
    let forRentCount = 0;
    const byType = new Map<string, { forSale: number; forRent: number }>();
    // Confirmed real on the Profolio dashboard's Listings card — boost tier
    // breakdown shown alongside purpose, mirrors AgentsRepository.getStats().
    const byBoostTier = new Map<string, number>();

    for (const row of listingRows ?? []) {
      const label = (row as any).property_types?.label ?? 'Other';
      const entry = byType.get(label) ?? { forSale: 0, forRent: 0 };
      if ((row as any).purpose === 'sale') {
        forSaleCount++;
        entry.forSale++;
      } else {
        forRentCount++;
        entry.forRent++;
      }
      byType.set(label, entry);

      const tier = (row as any).boost_tier as string;
      byBoostTier.set(tier, (byBoostTier.get(tier) ?? 0) + 1);
    }

    return {
      forSaleCount,
      forRentCount,
      byPropertyType: Array.from(byType.entries()).map(([label, counts]) => ({ label, ...counts })),
      byBoostTier: Array.from(byBoostTier.entries()).map(([tier, count]) => ({ tier, count })),
    };
  }

  async create(input: CreateAgencyDto) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        phone: input.phone,
        email: input.email,
        city: input.city,
        address: input.address,
        business_hours: input.businessHours,
        logo_url: input.logoUrl,
        verification_status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Super Admin verification decision — the write-mechanism `create()` above
  // deliberately left unbuilt (every agency starts and stays 'pending' until
  // now). Mirrors the verification/rejection pattern already established for
  // listings (verification_audit_log's status transitions).
  async setVerificationStatus(id: string, status: 'verified' | 'rejected') {
    // Hard gate — real business requirement: an agency can't be verified
    // without company registration, owner's ID card, and a tax certificate
    // already uploaded.
    if (status === 'verified') {
      await this.assertDocumentsComplete(id);
    }

    const { data, error } = await this.supabase.client
      .from('agencies')
      .update({ verification_status: status })
      .eq('id', id)
      .select(AGENCY_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, input: UpdateAgencyDto) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .update({
        name: input.name,
        description: input.description,
        phone: input.phone,
        email: input.email,
        city: input.city,
        address: input.address,
        business_hours: input.businessHours,
        logo_url: input.logoUrl,
      })
      .eq('id', id)
      .select(AGENCY_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('agencies').delete().eq('id', id);
    if (error) throw error;
    return { id };
  }

  // Real onboarding requirement — company registration, owner's ID card,
  // tax certificate. Only PNG/JPEG/PDF are accepted, enforced server-side in
  // DocumentsService.upload(), not just by file extension.
  async addDocument(agencyId: string, documentType: OnboardingDocumentType, file: Express.Multer.File) {
    const path = await this.documents.upload(`agencies/${agencyId}`, file);

    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .insert({ agency_id: agencyId, document_type: documentType, file_path: path })
      .select('id, document_type, file_path, uploaded_at')
      .single();
    if (error) throw error;

    return {
      id: data.id,
      documentType: data.document_type,
      url: await this.documents.getSignedUrl(data.file_path),
      uploadedAt: data.uploaded_at,
    };
  }

  async listDocuments(agencyId: string) {
    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .select('id, document_type, file_path, uploaded_at')
      .eq('agency_id', agencyId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;

    return Promise.all(
      (data ?? []).map(async (row: any) => ({
        id: row.id,
        documentType: row.document_type,
        url: await this.documents.getSignedUrl(row.file_path),
        uploadedAt: row.uploaded_at,
      })),
    );
  }

  async getDocumentCompleteness(agencyId: string) {
    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .select('document_type')
      .eq('agency_id', agencyId);
    if (error) throw error;

    const uploaded = Array.from(new Set((data ?? []).map((row: any) => row.document_type as OnboardingDocumentType)));
    const missing = REQUIRED_ONBOARDING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));

    return { required: REQUIRED_ONBOARDING_DOCUMENT_TYPES, uploaded, missing };
  }

  private async assertDocumentsComplete(agencyId: string) {
    const { missing } = await this.getDocumentCompleteness(agencyId);
    if (missing.length > 0) {
      throw new BadRequestException(`Cannot verify agency — missing required documents: ${missing.join(', ')}`);
    }
  }
}
